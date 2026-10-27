import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { apiRequest } from '../lib/api.js';
import { extractErrorMessages } from '../util/errorUtils.js';

const categories = {
  income: ['Salary', 'Business', 'Investment', 'Freelance', 'Other Income'],
  expense: [
    'Food', 'Transport', 'Housing', 'Utilities', 'Shopping', 'Health',
    'Education', 'Entertainment', 'Other Expense',
  ],
};

const currency = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const taskStatuses = ['Pending', 'In Progress', 'Done'];
const taskTabs = ['All', ...taskStatuses];
const noTasks = [];

const dateValue = (date) => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const displayDate = (date) => {
  if (!date) return 'No date';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? 'No date'
    : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const emptyTransaction = () => ({
  title: '',
  amount: '',
  type: 'expense',
  category: categories.expense[0],
  date: dateValue(new Date()),
});

export default function UserDashboard({ user }) {
  const queryClient = useQueryClient();
  const now = new Date();
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('transactions');
  const [taskStatus, setTaskStatus] = useState('All');
  const [form, setForm] = useState(emptyTransaction);
  const [editingId, setEditingId] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [taskForm, setTaskForm] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [taskFormError, setTaskFormError] = useState('');
  const [taskActionError, setTaskActionError] = useState('');

  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiRequest('/transactions'),
  });
  const tasksQuery = useQuery({
    queryKey: ['tasks', search],
    queryFn: () => apiRequest('/tasks', { query: { search } }),
    enabled: activeView === 'tasks',
  });
  const summaryQuery = useQuery({
    queryKey: ['monthlySummary', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => apiRequest('/transactions/summary/monthly', {
      query: { year: now.getFullYear(), month: now.getMonth() + 1 },
    }),
  });

  const refreshTransactions = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['monthlySummary'] }),
    ]);

  const saveTransaction = useMutation({
    mutationFn: ({ id, values }) => apiRequest(
      id ? `/transactions/${id}` : '/transactions',
      { method: id ? 'PUT' : 'POST', body: values },
    ),
    onSuccess: async () => {
      setForm(emptyTransaction());
      setEditingId('');
      setFormError('');
      setActionError('');
      await refreshTransactions();
    },
    onError: (error) => setFormError(extractErrorMessages(error)),
  });

  const deleteTransaction = useMutation({
    mutationFn: (id) => apiRequest(`/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setEditingId('');
      setActionError('');
      await refreshTransactions();
    },
    onError: (error) => setActionError(extractErrorMessages(error)),
  });

  const refreshTasks = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const saveTask = useMutation({
    mutationFn: ({ id, values }) => apiRequest(
      id ? `/tasks/${id}` : '/tasks',
      { method: id ? 'PATCH' : 'POST', body: values },
    ),
    onSuccess: async () => {
      setTaskForm(null);
      setEditingTaskId('');
      setTaskFormError('');
      setTaskActionError('');
      await refreshTasks();
    },
    onError: (error) => setTaskFormError(extractErrorMessages(error)),
  });

  const changeTaskStatus = useMutation({
    mutationFn: ({ id, status }) =>
      apiRequest(`/tasks/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: async () => {
      setTaskActionError('');
      await refreshTasks();
    },
    onError: (error) => setTaskActionError(extractErrorMessages(error)),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setTaskActionError('');
      await refreshTasks();
    },
    onError: (error) => setTaskActionError(extractErrorMessages(error)),
  });

  const visibleTransactions = useMemo(() => {
    const transactions = transactionsQuery.data?.transactions || [];
    const term = search.trim().toLowerCase();
    if (!term) return transactions;
    return transactions.filter((transaction) =>
      `${transaction.title} ${transaction.category} ${transaction.type}`.toLowerCase().includes(term),
    );
  }, [search, transactionsQuery.data]);

  const tasks = tasksQuery.data?.tasks || noTasks;
  const taskCounts = useMemo(() => ({
    All: tasks.length,
    Pending: tasks.filter((task) => task.status === 'Pending').length,
    'In Progress': tasks.filter((task) => task.status === 'In Progress').length,
    Done: tasks.filter((task) => task.status === 'Done').length,
  }), [tasks]);
  const visibleTasks = taskStatus === 'All'
    ? tasks
    : tasks.filter((task) => task.status === taskStatus);

  function handleFormSubmit(event) {
    event.preventDefault();
    setFormError('');
    setActionError('');

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }

    saveTransaction.mutate({
      id: editingId,
      values: {
        title: form.title.trim(),
        amount,
        type: form.type,
        category: form.category,
        ...(form.date ? { date: `${form.date}T00:00:00.000Z` } : {}),
      },
    });
  }

  function startEditing(transaction) {
    setEditingId(transaction._id);
    setForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: dateValue(transaction.date),
    });
    setFormError('');
    setActionError('');
  }

  function cancelEditing() {
    setEditingId('');
    setForm(emptyTransaction());
    setFormError('');
  }

  function openNewTaskForm() {
    setTaskForm({ title: '', description: '', dueDate: '', status: 'Pending' });
    setEditingTaskId('');
    setTaskFormError('');
    setTaskActionError('');
  }

  function startEditingTask(task) {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: dateValue(task.dueDate),
      status: task.status,
    });
    setEditingTaskId(task._id);
    setTaskFormError('');
    setTaskActionError('');
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    setTaskFormError('');
    setTaskActionError('');

    if (!taskForm?.title.trim()) {
      setTaskFormError('Enter a task title.');
      return;
    }

    saveTask.mutate({
      id: editingTaskId,
      values: {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        dueDate: taskForm.dueDate
          ? `${taskForm.dueDate}T00:00:00.000Z`
          : null,
        ...(editingTaskId ? { status: taskForm.status } : {}),
      },
    });
  }

  function cancelTaskForm() {
    setTaskForm(null);
    setEditingTaskId('');
    setTaskFormError('');
  }

  const totals = summaryQuery.data?.totals || { income: 0, expense: 0 };
  const balance = totals.income - totals.expense;
  const monthLabel = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <DashboardLayout user={user} activeLabel="My dashboard">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">YOUR FINANCES</p>
          <h1>Welcome, {user.username}</h1>
          <p className="muted">Here’s your personal money overview for {monthLabel}.</p>
        </div>
      </section>

      <section className="summary-grid" aria-label="Monthly summary">
        <SummaryCard label="Monthly income" value={totals.income} tone="positive" loading={summaryQuery.isPending} />
        <SummaryCard label="Monthly expenses" value={totals.expense} tone="negative" loading={summaryQuery.isPending} />
        <SummaryCard label="Monthly balance" value={balance} tone={balance >= 0 ? 'positive' : 'negative'} loading={summaryQuery.isPending} />
      </section>
      {summaryQuery.error && (
        <p className="notice notice-error" role="alert">
          Could not load the monthly summary: {extractErrorMessages(summaryQuery.error)}
        </p>
      )}

      <div className="dashboard-grid">
        <section className="panel transaction-panel">
          <div className="panel-heading">
            <div>
              <h2>{editingId ? 'Edit transaction' : 'Add a transaction'}</h2>
              <p className="muted">Record income or an expense.</p>
            </div>
          </div>
          <form className="form-stack" onSubmit={handleFormSubmit}>
            <label className="field">
              <span>Description</span>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                maxLength={100}
                placeholder="e.g. Monthly rent"
                required
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm({
                    ...form,
                    type: event.target.value,
                    category: categories[event.target.value][0],
                  })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Category</span>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {categories[form.type].map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </label>
            </div>
            {formError && <p className="notice notice-error" role="alert">{formError}</p>}
            <div className="button-row">
              <button className="button button-primary" disabled={saveTransaction.isPending}>
                {saveTransaction.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Add transaction'}
              </button>
              {editingId && <button className="button button-secondary" type="button" onClick={cancelEditing}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className="panel transactions-panel">
          <div className="panel-heading panel-heading-responsive">
            <div>
              <h2>{activeView === 'transactions' ? 'Transactions' : 'Task Management'}</h2>
              <p className="muted">
                {activeView === 'transactions'
                  ? 'Review and search your personal transactions.'
                  : 'Organize your work and track each task’s progress.'}
              </p>
            </div>
            <div className="view-switch" role="tablist" aria-label="Dashboard section">
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'transactions'}
                className={activeView === 'transactions' ? 'view-tab active' : 'view-tab'}
                onClick={() => setActiveView('transactions')}
              >
                Transactions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'tasks'}
                className={activeView === 'tasks' ? 'view-tab active' : 'view-tab'}
                onClick={() => setActiveView('tasks')}
              >
                Tasks
              </button>
            </div>
          </div>

          <label className="field shared-search">
            <span>{activeView === 'transactions' ? 'Search transactions' : 'Search tasks'}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={activeView === 'transactions'
                ? 'Description or category'
                : 'Search tasks by title or description'}
            />
          </label>

          {activeView === 'transactions' ? (
            <>
              {actionError && <p className="notice notice-error" role="alert">{actionError}</p>}
              {transactionsQuery.isPending && <p className="empty-state">Loading your transactions…</p>}
              {transactionsQuery.error && (
                <p className="notice notice-error" role="alert">
                  Could not load transactions: {extractErrorMessages(transactionsQuery.error)}
                </p>
              )}
              {!transactionsQuery.isPending && !transactionsQuery.error && visibleTransactions.length === 0 && (
                <p className="empty-state">No transactions match your search.</p>
              )}
              {visibleTransactions.length > 0 && (
                <div className="transaction-list">
                  {visibleTransactions.map((transaction) => (
                    <article className="transaction-item" key={transaction._id}>
                      <div className={`transaction-icon ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '−'}
                      </div>
                      <div className="transaction-description">
                        <strong>{transaction.title}</strong>
                        <span>{transaction.category} · {dateValue(transaction.date)}</span>
                      </div>
                      <strong className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'expense' ? '−' : '+'}{currency.format(transaction.amount)}
                      </strong>
                      <div className="transaction-actions">
                        <button className="text-button" onClick={() => startEditing(transaction)}>Edit</button>
                        <button
                          className="text-button text-danger"
                          onClick={() => {
                            if (window.confirm(`Delete "${transaction.title}"?`)) {
                              deleteTransaction.mutate(transaction._id);
                            }
                          }}
                          disabled={deleteTransaction.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <section className="task-section" aria-label="Task management">
              <div className="task-toolbar">
                <div className="task-status-tabs" role="tablist" aria-label="Filter tasks by status">
                  {taskTabs.map((status) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={taskStatus === status}
                      className={taskStatus === status ? 'task-status-tab active' : 'task-status-tab'}
                      key={status}
                      onClick={() => setTaskStatus(status)}
                    >
                      {status}
                      <span className="task-count">{tasksQuery.isPending ? '—' : taskCounts[status]}</span>
                    </button>
                  ))}
                </div>
                <button className="button button-primary" type="button" onClick={openNewTaskForm}>
                  Create New Task
                </button>
              </div>

              {taskForm && (
                <form className="task-form" onSubmit={handleTaskSubmit}>
                  <div className="task-form-heading">
                    <h3>{editingTaskId ? 'Edit task' : 'Create a task'}</h3>
                    <p className="muted">Add a title, details, and an optional due date.</p>
                  </div>
                  <label className="field">
                    <span>Title</span>
                    <input
                      value={taskForm.title}
                      onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                      maxLength={150}
                      placeholder="What needs to be done?"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Description</span>
                    <textarea
                      value={taskForm.description}
                      onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
                      maxLength={2000}
                      rows={3}
                      placeholder="Add a few details (optional)"
                    />
                  </label>
                  <div className="task-form-bottom">
                    <label className="field">
                      <span>Due date</span>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                      />
                    </label>
                    {editingTaskId && (
                      <label className="field">
                        <span>Status</span>
                        <select
                          value={taskForm.status}
                          onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })}
                        >
                          {taskStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                  {taskFormError && <p className="notice notice-error" role="alert">{taskFormError}</p>}
                  <div className="button-row">
                    <button className="button button-primary" disabled={saveTask.isPending}>
                      {saveTask.isPending ? 'Saving…' : editingTaskId ? 'Save task' : 'Create task'}
                    </button>
                    <button className="button button-secondary" type="button" onClick={cancelTaskForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {taskActionError && <p className="notice notice-error" role="alert">{taskActionError}</p>}
              {tasksQuery.isPending && <p className="empty-state">Loading your tasks…</p>}
              {tasksQuery.error && (
                <p className="notice notice-error" role="alert">
                  Could not load tasks: {extractErrorMessages(tasksQuery.error)}
                </p>
              )}
              {!tasksQuery.isPending && !tasksQuery.error && visibleTasks.length === 0 && (
                <p className="empty-state">
                  {tasks.length === 0
                    ? search.trim() ? 'No tasks match your search.' : 'No tasks yet. Create your first task to get started.'
                    : `No ${taskStatus.toLowerCase()} tasks match your search.`}
                </p>
              )}
              {visibleTasks.length > 0 && (
                <div className="task-list">
                  {visibleTasks.map((task) => (
                    <article className="task-card" key={task._id}>
                      <div className="task-card-main">
                        <div className="task-card-title-row">
                          <h3>{task.title}</h3>
                          <span className={`task-status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="task-description">
                          {task.description || 'No description provided.'}
                        </p>
                        <div className="task-dates">
                          <span><strong>Due:</strong> {displayDate(task.dueDate)}</span>
                          <span><strong>Created:</strong> {displayDate(task.createdAt)}</span>
                        </div>
                      </div>
                      <div className="task-card-actions">
                        <label className="field task-status-control">
                          <span>Change status</span>
                          <select
                            value={task.status}
                            onChange={(event) => changeTaskStatus.mutate({
                              id: task._id,
                              status: event.target.value,
                            })}
                            disabled={changeTaskStatus.isPending}
                          >
                            {taskStatuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                        <button className="text-button" onClick={() => startEditingTask(task)}>Edit</button>
                        <button
                          className="text-button text-danger"
                          onClick={() => {
                            if (window.confirm(`Delete "${task.title}"?`)) {
                              deleteTask.mutate(task._id);
                            }
                          }}
                          disabled={deleteTask.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ label, value, tone, loading }) {
  return (
    <article className="summary-card">
      <span className="summary-label">{label}</span>
      <strong className={tone}>{loading ? '—' : currency.format(value)}</strong>
      <span className="summary-footnote">This month</span>
    </article>
  );
}
