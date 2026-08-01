import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, X, Wallet, Users, LayoutDashboard, Settings2, Briefcase, TrendingUp, Pencil } from 'lucide-react';
import { Project, EmployeePay, Language, Currency } from './types';
import { t } from './translations';
import { useLocalStorage, formatCurrency } from './utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [language, setLanguage] = useLocalStorage<Language>('app_language', 'en');
  const [currency, setCurrency] = useLocalStorage<Currency>('app_currency', 'USD');
  const [exchangeRate, setExchangeRate] = useLocalStorage<number>('app_exchange_rate', 150000);
  
  const [projects, setProjects] = useLocalStorage<Project[]>('app_projects', []);
  const [payments, setPayments] = useLocalStorage<EmployeePay[]>('app_payments', []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'project' | 'payment'>('project');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingPayment, setEditingPayment] = useState<EmployeePay | null>(null);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<EmployeePay | null>(null);

  const loc = t[language];
  const dir = language === 'ku' ? 'rtl' : 'ltr';

  // Stats calculation
  const stats = useMemo(() => {
    const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
    const totalPayouts = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalRevenue,
      totalPayouts,
      netProfit: totalRevenue - totalPayouts,
      projectsCount: projects.length
    };
  }, [projects, payments]);

  // Search filtering
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const lowerQuery = searchQuery.toLowerCase();
    
    return projects.filter(p => {
      // Check project name and client
      if (p.name.toLowerCase().includes(lowerQuery)) return true;
      if (p.clientName.toLowerCase().includes(lowerQuery)) return true;
      
      // Check if any payment for this project matches employee name
      const projectPayments = payments.filter(pay => pay.projectId === p.id);
      return projectPayments.some(pay => pay.employeeName.toLowerCase().includes(lowerQuery));
    });
  }, [projects, payments, searchQuery]);

  // Project Details Calculation
  const getProjectDetails = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    const projectPayments = payments.filter(p => p.projectId === projectId);
    const totalPaid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      project,
      payments: projectPayments,
      totalPaid,
      remaining: project.revenue - totalPaid
    };
  };

  // Handlers
  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      revenue: parseFloat(formData.get('revenue') as string),
      clientName: formData.get('clientName') as string,
      createdAt: Date.now()
    };
    setProjects([newProject, ...projects]);
    setIsAddModalOpen(false);
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPayment: EmployeePay = {
      id: crypto.randomUUID(),
      projectId: formData.get('projectId') as string,
      employeeName: formData.get('employeeName') as string,
      amount: parseFloat(formData.get('amount') as string),
      role: formData.get('role') as string,
      createdAt: Date.now()
    };
    setPayments([newPayment, ...payments]);
    setIsAddModalOpen(false);
  };

  const handleEditProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProject) return;
    const formData = new FormData(e.currentTarget);
    const updatedProject: Project = {
      ...editingProject,
      name: formData.get('name') as string,
      revenue: parseFloat(formData.get('revenue') as string),
      clientName: formData.get('clientName') as string,
    };
    setProjects(prevProjects => {
      const updated = prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('app_projects', JSON.stringify(updated));
      return updated;
    });
    setEditingProject(null);
  };

  const handleEditPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPayment) return;
    const formData = new FormData(e.currentTarget);
    const updatedPayment: EmployeePay = {
      ...editingPayment,
      employeeName: formData.get('employeeName') as string,
      amount: parseFloat(formData.get('amount') as string),
      role: formData.get('role') as string,
    };
    setPayments(prevPayments => {
      const updated = prevPayments.map(p => p.id === updatedPayment.id ? updatedPayment : p);
      localStorage.setItem('app_payments', JSON.stringify(updated));
      return updated;
    });
    setEditingPayment(null);
  };

  const handleDeleteProject = (projectId: string) => {
    // 1. Immediately close modal
    setSelectedProject(null);

    // 2. Functional state update (guarantees fresh state)
    setProjects(prevProjects => {
      const updated = prevProjects.filter(p => p.id !== projectId);
      localStorage.setItem('app_projects', JSON.stringify(updated));
      return updated;
    });

    setPayments(prevPayments => {
      const updated = prevPayments.filter(e => e.projectId !== projectId);
      localStorage.setItem('app_payments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    setPayments(prev => {
      const updated = prev.filter(p => p.id !== paymentId);
      localStorage.setItem('app_payments', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-200" dir={dir}>
      {/* Top Header / Settings */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
          <div>
            <h1 className="text-lg font-bold leading-none">{loc.appTitle}</h1>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 cursor-pointer">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${currency === 'USD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              USD $
            </button>
            <button
              onClick={() => setCurrency('IQD')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${currency === 'IQD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              IQD د.ع
            </button>
          </div>
          
          {/* Exchange Rate Input */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">100$ =</span>
            <input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
              placeholder={loc.ratePlaceholder}
              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <span className="text-slate-500 font-medium">IQD</span>
          </div>

          <button
            onClick={() => setLanguage(language === 'en' ? 'ku' : 'en')}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-md hover:bg-slate-700 transition-colors"
          >
            EN / کوردی
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 flex flex-col gap-6 pb-24">

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={loc.totalRevenue} amount={stats.totalRevenue} currency={currency} exchangeRate={exchangeRate} />
          <StatCard title={loc.totalPayouts} amount={stats.totalPayouts} currency={currency} exchangeRate={exchangeRate} numberColor="text-rose-600" />
          <StatCard title={loc.netProfit} amount={stats.netProfit} currency={currency} exchangeRate={exchangeRate} containerClass="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm ring-1 ring-emerald-500/10" titleClass="text-emerald-600" numberColor="text-emerald-700" />
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{loc.totalProjectsCount}</p>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{stats.projectsCount}</h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-96 mb-2 mt-4">
          <input
            type="text"
            placeholder={loc.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${language === 'ku' ? 'pr-8 pl-4' : 'pl-8 pr-4'}`}
          />
          <span className={`absolute top-2 text-slate-400 ${language === 'ku' ? 'right-2.5' : 'left-2.5'}`}>
            <Search className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Projects List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredProjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-slate-400 text-sm font-medium"
              >
                {loc.noProjects}
              </motion.div>
            ) : (
              filteredProjects.map((project) => {
                const details = getProjectDetails(project.id)!;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={project.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:bg-indigo-50/50 hover:border-indigo-200 border-l-4 border-l-indigo-500 transition-colors flex items-center justify-between gap-2"
                  >
                    <div 
                      onClick={() => setSelectedProject(project)} 
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{project.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{project.clientName}</p>
                      </div>
                      <div className="flex-1 text-right sm:text-left">
                         <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{loc.budget}</p>
                         <p className="text-sm font-mono text-slate-600 font-semibold">{formatCurrency(project.revenue, currency, exchangeRate)}</p>
                      </div>
                      <div className="hidden sm:block flex-1 text-right">
                         <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{loc.remaining}</p>
                         <p className="text-sm font-mono text-emerald-600 font-bold">{formatCurrency(details.remaining, currency, exchangeRate)}</p>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingProject(project);
                        }}
                        className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-200 flex items-center justify-center"
                        title={loc.editProject}
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setProjectToDelete(project);
                        }}
                        className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                        title={loc.deleteProject}
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Add Button Context */}
      <div className={`fixed bottom-8 flex flex-col items-end gap-3 z-20 ${language === 'ku' ? 'left-8' : 'right-8'}`}>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-2xl transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-bold">
            {loc.addEntry}
          </span>
        </button>
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative z-10"
              dir={dir}
            >
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setAddModalTab('project')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${addModalTab === 'project' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {loc.addProject}
                </button>
                <button
                  onClick={() => setAddModalTab('payment')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${addModalTab === 'payment' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {loc.addEmployeePay}
                </button>
              </div>

              <div className="p-6">
                {addModalTab === 'project' ? (
                  <form onSubmit={handleAddProject} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.projectName}</label>
                      <input required name="name" type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.revenue}</label>
                      <input required name="revenue" type="number" step="0.01" min="0" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.clientName}</label>
                      <input required name="clientName" type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-lg transition-colors mt-2">
                      {loc.save}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.selectProject}</label>
                      <select required name="projectId" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white">
                        <option value="">-- {loc.selectProject} --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.employeeName}</label>
                      <input required name="employeeName" type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.amountPaid}</label>
                      <input required name="amount" type="number" step="0.01" min="0" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.role}</label>
                      <input required name="role" type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-lg transition-colors mt-2">
                      {loc.save}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Project Modal */}
      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProject(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative z-10"
              dir={dir}
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">{loc.editProject}</h3>
                <button onClick={() => setEditingProject(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleEditProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.projectName}</label>
                    <input required name="name" type="text" defaultValue={editingProject.name} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.revenue}</label>
                    <input required name="revenue" type="number" step="0.01" min="0" defaultValue={editingProject.revenue} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.clientName}</label>
                    <input required name="clientName" type="text" defaultValue={editingProject.clientName} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-lg transition-colors mt-2">
                    {loc.save}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Payment Modal */}
      <AnimatePresence>
        {editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPayment(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative z-10"
              dir={dir}
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">{loc.editPayment}</h3>
                <button onClick={() => setEditingPayment(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleEditPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.employeeName}</label>
                    <input required name="employeeName" type="text" defaultValue={editingPayment.employeeName} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.amountPaid}</label>
                    <input required name="amount" type="number" step="0.01" min="0" defaultValue={editingPayment.amount} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{loc.role}</label>
                    <input required name="role" type="text" defaultValue={editingPayment.role} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-lg transition-colors mt-2">
                    {loc.save}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Confirmation */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden relative z-10"
              dir={dir}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-bold text-xl text-slate-800 mb-2">{loc.deleteProjectConfirmTitle}</h3>
                <p className="text-sm text-slate-500 mb-6">{loc.deleteProjectConfirmText}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setProjectToDelete(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    {loc.cancel}
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteProject(projectToDelete.id);
                      setProjectToDelete(null);
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                  >
                    {loc.confirmDelete}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Payment Confirmation */}
      <AnimatePresence>
        {paymentToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPaymentToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden relative z-10"
              dir={dir}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-bold text-xl text-slate-800 mb-2">{loc.deletePaymentConfirmTitle}</h3>
                <p className="text-sm text-slate-500 mb-6">{loc.deletePaymentConfirmText}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentToDelete(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    {loc.cancel}
                  </button>
                  <button
                    onClick={() => {
                      handleDeletePayment(paymentToDelete.id);
                      setPaymentToDelete(null);
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                  >
                    {loc.confirmDelete}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden relative z-10"
              dir={dir}
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold mb-1">{selectedProject.name}</h2>
                  <p className="text-xs opacity-70">{selectedProject.clientName}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex justify-between text-xs opacity-80">
                    <span>{loc.budget}</span>
                    <span className="font-mono">{formatCurrency(selectedProject.revenue, currency, exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between text-xs opacity-80">
                    <span>{loc.payments}</span>
                    <span className="font-mono text-rose-400">-{formatCurrency(getProjectDetails(selectedProject.id)?.totalPaid ?? 0, currency, exchangeRate)}</span>
                  </div>
                  <div className="h-px bg-white/10 my-1"></div>
                  <div className="flex justify-between font-bold">
                    <span className="text-sm">{loc.remaining}</span>
                    <span className="text-emerald-400 font-mono text-lg">{formatCurrency(getProjectDetails(selectedProject.id)?.remaining ?? 0, currency, exchangeRate)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">{loc.payments}</h4>
                  <div className="space-y-3">
                    {(getProjectDetails(selectedProject.id)?.payments || []).length === 0 ? (
                      <p className="text-white/40 text-xs">{loc.noPayments}</p>
                    ) : (
                      (getProjectDetails(selectedProject.id)?.payments || []).map(pay => (
                        <div key={pay.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
                              {pay.employeeName.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{pay.employeeName}</p>
                              <p className="text-[10px] text-white/40">{pay.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-300 mr-2">{formatCurrency(pay.amount, currency, exchangeRate)}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditingPayment(pay); setSelectedProject(null); }} className="text-white/20 hover:text-blue-400 transition-colors p-1" title={loc.editPayment}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPaymentToDelete(pay); setSelectedProject(null); }} className="text-white/20 hover:text-rose-400 transition-colors p-1" title={loc.deletePayment}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, amount, currency, exchangeRate, containerClass, titleClass, numberColor }: { title: string, amount: number, currency: Currency, exchangeRate: number, containerClass?: string, titleClass?: string, numberColor?: string }) {
  return (
    <div className={containerClass || "bg-white p-4 rounded-xl border border-slate-200 shadow-sm"}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${titleClass || "text-slate-500"}`}>{title}</p>
      <h2 className={`text-2xl font-bold tracking-tight ${numberColor || "text-slate-800"}`}>
        {formatCurrency(amount, currency, exchangeRate)}
      </h2>
    </div>
  );
}
