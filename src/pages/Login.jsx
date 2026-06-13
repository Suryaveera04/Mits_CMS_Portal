// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Eye, EyeOff, LogIn, Users, Shield, GraduationCap, AlertCircle } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const selectRole = (role) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError('');
  };

  const useMockLogin = import.meta.env.VITE_ENABLE_MOCK_LOGIN === 'true';

  const mockUsers = [
    { id: '1', name: 'Surya', email: 'surya@mits.edu', password: 'Surya@123', role: 'FACULTY', department: 'AIML', designation: 'Assistant Professor', avatar: null },
    { id: '2', name: 'Raghu', email: 'raghu@mits.edu', password: 'Surya@123', role: 'FACULTY', department: 'AIML', designation: 'Assistant Professor', avatar: null },
    { id: '3', name: 'Padma', email: 'padma@mits.edu', password: 'Surya@123', role: 'HOD', department: 'AIML', designation: 'Professor & HOD', avatar: null },
  ];

  const localMockLogin = (loginEmail, loginPassword) => {
    const found = mockUsers.find(u => u.email.toLowerCase() === String(loginEmail).toLowerCase().trim());
    if (!found || found.password !== loginPassword) {
      throw new Error('Invalid email or password (mock)');
    }
    const { id, name, role, department, designation, avatar, email } = found;
    return { id, name, email, role, department, designation, avatar };
  };

  const handleApiLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    // Try real backend first, fall back to local mock if network fails or backend unreachable
    try {
      // Determine role from selectedRole or scan the email intelligently
      let role = selectedRole || 'faculty';
      const emailLower = loginEmail.toLowerCase();
      if (emailLower.includes('admin')) {
        role = 'admin';
      } else if (
        emailLower.includes('hod') || 
        emailLower.includes('padma') || 
        emailLower.includes('kalpana') || 
        emailLower.includes('persis') || 
        emailLower.includes('vijay') || 
        emailLower.includes('manavaal') || 
        emailLower.includes('rajasek') || 
        emailLower.includes('baskar')
      ) {
        role = 'hod';
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '/backend';
      const res = await fetch(`${apiBase}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginEmail.split('@')[0], password: loginPassword, role }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error('Backend returned an invalid response. Make sure the PHP backend is running.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Ensure role is uppercase to match app expectations
      const userData = {
        ...data.user,
        role: role.toUpperCase(),
        name: data.user.faculty_name || data.user.username || 'User'
      };
      
      login(userData, data.token);
      navigate('/dashboard');
    } catch (err) {
      // Only fall back to mocked users for explicit local development testing.
      if (useMockLogin) {
        try {
          const data = localMockLogin(loginEmail, loginPassword);
          login(data);
          navigate('/dashboard');
          return;
        } catch (mockErr) {
          setError(mockErr.message || err.message || 'Login failed');
          setLoading(false);
          return;
        }
      }

      setError(err.message || 'Backend login failed. Please verify the API URL and database connection.');
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleApiLogin(email, password);
  };

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoBox}>
            <div className={styles.logoCircle}>M</div>
          </div>
        </div>
        <div className={styles.headerCenter}>
          <h1 className={styles.collegeName}>Madanapalle Institute of Technology & Science</h1>
          <p className={styles.collegeSubtitle}>Department Content Management System</p>
        </div>
        <div className={styles.headerRight} />
      </header>

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        <div className={styles.loginContainer}>
          {/* LEFT: Role Selection */}
          <div className={styles.roleSection}>
            <h2 className={styles.sectionTitle}>Select Login Type</h2>
            <p className={styles.sectionDesc}>Choose your role to access the portal</p>
            
            <div className={styles.roleButtons}>
              <button 
                className={`${styles.roleBtn} ${selectedRole === 'faculty' ? styles.roleBtnActive : ''}`}
                onClick={() => selectRole('faculty')}
                disabled={loading}
              >
                <div className={styles.roleIcon}>
                  <GraduationCap size={24} />
                </div>
                <div className={styles.roleInfo}>
                  <div className={styles.roleName}>Faculty Login</div>
                  <div className={styles.roleDesc}>Access your profile and submissions</div>
                </div>
              </button>

              <button 
                className={`${styles.roleBtn} ${selectedRole === 'hod' ? styles.roleBtnActive : ''}`}
                onClick={() => selectRole('hod')}
                disabled={loading}
              >
                <div className={styles.roleIcon}>
                  <Users size={24} />
                </div>
                <div className={styles.roleInfo}>
                  <div className={styles.roleName}>HOD Login</div>
                  <div className={styles.roleDesc}>Review and approve faculty submissions</div>
                </div>
              </button>

              <button 
                className={`${styles.roleBtn} ${selectedRole === 'admin' ? styles.roleBtnActive : ''}`}
                onClick={() => selectRole('admin')}
                disabled={loading}
              >
                <div className={styles.roleIcon}>
                  <Shield size={24} />
                </div>
                <div className={styles.roleInfo}>
                  <div className={styles.roleName}>Admin Login</div>
                  <div className={styles.roleDesc}>Manage events, MoUs, and content</div>
                </div>
              </button>
            </div>
          </div>

          {/* RIGHT: Login Form */}
          <div className={styles.formSection}>
            <div className={styles.formBox}>
              <h2 className={styles.formTitle}>Sign In</h2>
              <p className={styles.formSubtitle}>Enter your credentials to continue</p>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="you@mits.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Enter password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(s => !s)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={styles.errorMsg}>
                    <AlertCircle size={14} />{error}
                  </div>
                )}

                <button type="submit" className={styles.loginBtn} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : <LogIn size={16} />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>


            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p>© 2024 Madanapalle Institute of Technology & Science. All rights reserved.</p>
      </footer>
    </div>
  );
}
