import React, { useState, useEffect } from 'react';
import API from './services/api';
import './App.css';

function App() {
  const savedToken = localStorage.getItem('token');
  const isValidToken = savedToken && savedToken !== 'undefined' && savedToken !== 'null';

  const [token, setToken] = useState(isValidToken ? savedToken : '');
  const [isLoggedIn, setIsLoggedIn] = useState(isValidToken);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Work');

  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCategory, setEditCategory] = useState('Work');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'Completed'

  useEffect(() => {
    if (token && token !== 'undefined' && token !== 'null') {
      fetchTasks();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await API.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { email, password });
      const authToken = res.data.token;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/register', { name, email, password });
      alert('Registration successful! Please login.');
      setIsRegisterMode(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setIsLoggedIn(false);
    setTasks([]);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await API.post('/tasks', { title, description, priority, dueDate, category });
      setTasks([...tasks, res.data]);
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setCategory('Work');
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'Completed' ? 'pending' : 'Completed';
    try {
      const res = await API.put(`/tasks/${task._id}`, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        dueDate: task.dueDate,
        category: task.category,
      });
      setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'Medium');
    setEditDueDate(task.dueDate || '');
    setEditCategory(task.category || 'Work');
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      const res = await API.put(`/tasks/${editingTask._id}`, {
        title: editTitle,
        description: editDescription,
        status: editingTask.status,
        priority: editPriority,
        dueDate: editDueDate,
        category: editCategory,
      });
      
      setTasks(tasks.map((t) => (t._id === editingTask._id ? res.data : t)));
      setEditingTask(null);
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  // Stats Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter and Search Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === 'pending') return matchesSearch && task.status !== 'Completed';
    if (filterStatus === 'Completed') return matchesSearch && task.status === 'Completed';
    return matchesSearch;
  });

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h2>{isRegisterMode ? 'Register' : 'Login'}</h2>
        <form onSubmit={isRegisterMode ? handleRegister : handleLogin}>
          {isRegisterMode && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            {isRegisterMode ? 'Register' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="link-text"
          >
            {isRegisterMode ? 'Login here' : 'Register here'}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="header-row">
        <h2>Task Dashboard 📝</h2>
        <button onClick={handleLogout} className="btn-danger">
          Logout
        </button>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="form-box">
        <h3>Add New Task</h3>
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="priority-select"
        >
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
        </select>
        
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="date-input"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="priority-select"
        >
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Study">Study</option>
        </select>

        <button type="submit" className="btn-success">
          Add Task
        </button>
      </form>

      {/* Edit Task Form */}
      {editingTask && (
        <form onSubmit={handleUpdateTask} className="edit-form-box">
          <h3>Edit Task</h3>
          <input
            type="text"
            placeholder="Task Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Task Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="priority-select"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="date-input"
          />

          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="priority-select"
          >
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Study">Study</option>
          </select>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
              Save Changes
            </button>
            <button type="button" onClick={() => setEditingTask(null)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <h3 style={{ marginTop: '30px' }}>Your Tasks</h3>

      {/* Task Stats & Progress Bar Section */}
      <div className="stats-container">
        <div className="stats-info">
          <span>Total: <strong>{totalTasks}</strong></span>
          <span>Pending: <strong>{pendingTasks}</strong></span>
          <span>Completed: <strong>{completedTasks}</strong></span>
        </div>
        <div className="progress-bar-wrapper">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="progress-text">{progressPercentage}% Completed</span>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="🔍 Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="filter-btn-group">
          <button
            onClick={() => setFilterStatus('all')}
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('Completed')}
            className={`filter-btn ${filterStatus === 'Completed' ? 'active' : ''}`}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', margin: '20px 0' }}>No tasks found!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredTasks.map((task) => (
            <li key={task._id} className={`task-card ${task.status === 'Completed' ? 'completed' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={task.status === 'Completed'}
                  onChange={() => handleToggleComplete(task)}
                  className="task-checkbox"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0 }}>{task.title}</h4>
                    <span className={`priority-badge ${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
                      {task.priority || 'Medium'}
                    </span>
                    {task.category && (
                      <span className={`category-badge ${task.category.toLowerCase()}`}>
                        🏷️ {task.category}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="due-date-badge">
                        📅 {task.dueDate}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#555' }}>{task.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => startEditing(task)}
                  className="btn-warning"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;