/**
 * CampusReclaim - Client-Side Logic (PHP Backend Version)
 */

// --- STORE (Session Management) ---
const Store = {
    getUser: () => JSON.parse(sessionStorage.getItem('user')),
    setUser: (user) => sessionStorage.setItem('user', JSON.stringify(user)),
    clearUser: () => sessionStorage.removeItem('user')
};

// --- AUTH MODULE ---
const Auth = {
    init: () => {
        const user = Store.getUser();
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelector('.nav-links');

        if (navbar) navbar.classList.remove('hidden');

        if (user) {
            // Update UI based on role
            if (user.role === 'admin') {
                navLinks.innerHTML = `
                    <button onclick="router.navigate('admin-dashboard')" class="nav-btn active"><i class="fa-solid fa-gauge"></i> Admin</button>
                    <button onclick="router.navigate('admin-users')" class="nav-btn"><i class="fa-solid fa-users"></i> Users</button>
                    <button onclick="router.navigate('dashboard')" class="nav-btn"><i class="fa-solid fa-earth-americas"></i> Public Feed</button>
                    <button onclick="auth.logout()" class="nav-btn logout"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
                `;
            } else {
                navLinks.innerHTML = `
                    <button onclick="router.navigate('dashboard')" class="nav-btn active"><i class="fa-solid fa-house"></i> Home</button>
                    <button onclick="router.navigate('my-items')" class="nav-btn"><i class="fa-solid fa-layer-group"></i> My Items</button>
                    <button onclick="router.navigate('messages')" class="nav-btn"><i class="fa-solid fa-envelope"></i> Messages</button>
                    <button onclick="router.navigate('profile')" class="nav-btn"><i class="fa-solid fa-user-gear"></i> Profile</button>
                    <button onclick="router.navigate('analytics')" class="nav-btn"><i class="fa-solid fa-chart-line"></i> Analytics</button>
                    <button onclick="router.navigate('report')" class="nav-btn"><i class="fa-solid fa-circle-plus"></i> Report Item</button>
                    <button onclick="auth.logout()" class="nav-btn logout"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
                `;
            }
        } else {
            // Guest Mode
            navLinks.innerHTML = `
                <button onclick="router.navigate('dashboard')" class="nav-btn active"><i class="fa-solid fa-house"></i> Home</button>
                <button onclick="router.navigate('analytics')" class="nav-btn"><i class="fa-solid fa-chart-line"></i> Analytics</button>
                <button onclick="router.navigate('login')" class="nav-btn"><i class="fa-solid fa-right-to-bracket"></i> Login</button>
                <button onclick="router.navigate('login', 'admin')" class="nav-btn logout"><i class="fa-solid fa-user-shield"></i> Admin Access</button>
            `;
        }

        // Initial Routing handled by DOMContentLoaded -> handleRouting
        if (!window.location.hash) {
            Router.navigate('dashboard', null, true);
        } else {
            handleRouting();
        }
    },

    login: async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            const res = await fetch('login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.status === 'success') {
                Store.setUser(data.user);
                Toast.show('Welcome back!', 'success');
                Auth.init(); // Refresh UI

                // Redirect based on role
                if (data.user.role === 'admin') {
                    Router.navigate('admin-dashboard');
                } else {
                    Router.navigate('dashboard');
                }
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            Toast.show(err.message, 'error');
        }
    },

    register: async (e) => {
        e.preventDefault();
        const full_name = e.target.fullName.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const role = document.getElementById('admin-tab-reg')?.classList.contains('active') ? 'admin' : 'user';

        try {
            const res = await fetch('register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name, email, password, role })
            });
            const data = await res.json();

            if (data.status === 'success') {
                Store.setUser(data.user);
                Toast.show('Account created successfully!', 'success');
                Auth.init();

                if (data.user.role === 'admin') {
                    Router.navigate('admin-dashboard');
                } else {
                    Router.navigate('dashboard');
                }
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            Toast.show(err.message, 'error');
        }
    },

    logout: () => {
        Store.clearUser();
        Auth.init(); // Refresh UI to Guest Mode
        Toast.show('Logged out successfully', 'success');
        Router.navigate('login');
    }
};

// --- ROUTER & VIEWS ---
const Router = {
    currentRoute: null,

    navigate: (route, param = null, replace = false) => {
        const hash = `#${route}${param ? '/' + param : ''}`;

        if (Router.currentRoute === route && replace) {
            // Force reload if same route and replace is requested (e.g. login redirect)
            handleRouting();
            return;
        }

        if (replace) {
            const url = window.location.href.split('#')[0] + hash;
            window.location.replace(url);
        } else {
            window.location.hash = hash;
        }
        // No manual loadPage call here; hashchange listener handles it
    },

    loadPage: (route, param = null) => {
        // This function is called by handleRouting
        Router.currentRoute = route;
        const app = document.getElementById('main-content');

        if (!app) {
            // Retry briefly if app not ready (race condition on load)
            setTimeout(() => Router.loadPage(route, param), 50);
            return;
        }

        app.innerHTML = ''; // Clear current view

        // Update Navigation Active State
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            // Simple check for onclick attribute containing the route name
            const onclick = btn.getAttribute('onclick');
            if (onclick && onclick.includes(`'${route}'`)) {
                btn.classList.add('active');
            }
        });

        // Resolve generic param for auth views
        const authMode = param || 'user';

        // Route Handler
        switch (route) {
            case 'login':
                app.innerHTML = Views.Login(authMode);
                break;
            case 'register':
                app.innerHTML = Views.Register(authMode);
                break;
            case 'dashboard':
                app.innerHTML = Views.Dashboard();
                DashboardLogic.init();
                break;
            case 'my-items':
                if (!Store.getUser()) {
                    Toast.show('Please login to manage items', 'error');
                    Router.navigate('login', null, true);
                } else {
                    app.innerHTML = Views.MyItems();
                    DashboardLogic.init();
                }
                break;
            case 'messages':
                if (!Store.getUser()) {
                    Toast.show('Please login to view messages', 'error');
                    Router.navigate('login', null, true);
                } else {
                    app.innerHTML = Views.Messages();
                    DashboardLogic.fetchMessages();
                }
                break;
            case 'analytics':
                app.innerHTML = Views.Analytics();
                DashboardLogic.init();
                break;
            case 'report':
                if (!Store.getUser()) {
                    Toast.show('Please login to report items', 'error');
                    Router.navigate('login', null, true);
                } else {
                    app.innerHTML = Views.Report();
                }
                break;
            case 'profile':
                if (!Store.getUser()) {
                    Toast.show('Please login to view profile', 'error');
                    Router.navigate('login', null, true);
                } else {
                    app.innerHTML = Views.Profile();
                    DashboardLogic.init();
                }
                break;
            case 'account-settings':
                if (!Store.getUser()) {
                    Router.navigate('login', null, true);
                } else {
                    app.innerHTML = Views.AccountSettings();
                }
                break;
            case 'admin-dashboard':
                if (Store.getUser()?.role !== 'admin') {
                    Router.navigate('dashboard', null, true);
                } else {
                    app.innerHTML = Views.AdminDashboard();
                    AdminLogic.init();
                }
                break;
            case 'admin-users':
                if (Store.getUser()?.role !== 'admin') {
                    Router.navigate('dashboard', null, true);
                } else {
                    app.innerHTML = Views.AdminUsers();
                    AdminLogic.loadUsers();
                }
                break;
            case 'view-item':
                (async () => {
                    // Pre-load items if not already loaded (deep link scenario)
                    if (DashboardLogic.itemList.length === 0) {
                        await DashboardLogic.init();
                    }

                    const item = DashboardLogic.itemList.find(i => i.id == param);

                    if (item) {
                        app.innerHTML = Views.ItemDetailPage(item);
                        window.scrollTo(0, 0);
                    } else {
                        Toast.show('Item not found or deleted', 'error');
                        Router.navigate('dashboard', null, true);
                    }
                })();
                break;
            default:
                // Fallback to dashboard
                console.warn(`Route ${route} not found, defaulting to dashboard`);
                app.innerHTML = Views.Dashboard();
                DashboardLogic.init();
        }
    }
};

// Central Hash Handler
const handleRouting = () => {
    // format: #route/param
    const hash = window.location.hash.slice(1); // Remove '#'

    if (!hash) return; // Wait for default nav

    const parts = hash.split('/');
    const route = parts[0];
    const param = parts.length > 1 ? parts[1] : null;

    Router.loadPage(route, param);
};

// Listeners
window.addEventListener('hashchange', handleRouting);
// Note: initial check is done in Auth.init or DOMContentLoaded logic below

// Handle Browser Back/Forward


const Views = {
    Login: (mode = 'user') => `
        <div class="auth-container fade-in">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Login to your CampusReclaim account</p>
                </div>
                
                <div style="display: flex; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 4px; margin-bottom: 2rem; border: 1px solid var(--glass-border);">
                    <button id="user-tab" class="nav-btn ${mode === 'user' ? 'active' : ''}" style="flex:1; justify-content:center; border-radius: 8px;" onclick="Views.toggleLoginMode('user')">
                        <i class="fa-solid fa-user"></i> User
                    </button>
                    <button id="admin-tab" class="nav-btn ${mode === 'admin' ? 'active' : ''}" style="flex:1; justify-content:center; border-radius: 8px;" onclick="Views.toggleLoginMode('admin')">
                        <i class="fa-solid fa-user-shield"></i> Admin
                    </button>
                </div>

                <form onsubmit="Auth.login(event)">
                    <div class="form-group">
                        <label id="login-label" class="form-label">${mode === 'admin' ? 'Admin ID / Email' : 'Email Address'}</label>
                        <input type="text" name="email" class="form-input" placeholder="${mode === 'admin' ? 'e.g. admin' : 'student@university.ac.lk'}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-input" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn-primary" id="login-btn">${mode === 'admin' ? 'Login as Administrator' : 'Login to My Account'}</button>
                    
                    <div class="auth-switch" id="skip-link" style="margin-top: 2rem;">
                        <button type="button" class="contact-btn" style="width: 100%; padding: 1rem; font-size: 1.1rem; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);" onclick="Router.navigate('dashboard')">
                           <i class="fa-solid fa-arrow-right-to-bracket"></i> Skip & Go to Dashboard
                        </button>
                    </div>

                    <div class="auth-switch" id="signup-link" style="margin-top: 1.5rem;">
                        New here? <span class="auth-link" onclick="Router.navigate('register')">Create an account</span>
                    </div>
                </form>
            </div>
        </div>
    `,

    toggleLoginMode: (mode) => {
        const btn = document.getElementById('login-btn');
        const userTab = document.getElementById('user-tab');
        const adminTab = document.getElementById('admin-tab');
        const skip = document.getElementById('skip-link');
        const signup = document.getElementById('signup-link');
        const label = document.getElementById('login-label');
        const input = document.querySelector('input[name="email"]');

        if (mode === 'admin') {
            btn.innerText = 'Login as Administrator';
            adminTab.classList.add('active');
            userTab.classList.remove('active');
            if (skip) skip.style.display = 'none';
            if (signup) signup.style.display = 'none';
            if (label) label.innerText = 'Admin ID / Email';
            if (input) input.placeholder = 'e.g. admin';
        } else {
            btn.innerText = 'Login to My Account';
            userTab.classList.add('active');
            adminTab.classList.remove('active');
            if (skip) skip.style.display = 'block';
            if (signup) signup.style.display = 'block';
            if (label) label.innerText = 'Email Address';
            if (input) input.placeholder = 'student@university.ac.lk';
        }
    },

    AdminDashboard: () => `
        <div class="dashboard-container fade-in">
            <div class="hero-section" style="padding: 3rem;">
                <h1 class="hero-title">Admin Command Center</h1>
                <p>Monitor system activity and manage oversight.</p>
                
                <div class="stats-row">
                    <div class="stat-item">
                        <div class="stat-number" id="adm-total-users">0</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="adm-total-items" style="color:var(--primary)">0</div>
                        <div class="stat-label">Total Reports</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="adm-resolved" style="color:var(--primary-dark)">0</div>
                        <div class="stat-label">Resolved</div>
                    </div>
                </div>
            </div>

            <h2 style="margin-bottom: 2rem">System Items Registry</h2>
            <div id="items-grid" class="items-grid"></div>
        </div>
    `,

    AdminUsers: () => `
        <div class="dashboard-container fade-in">
            <h1 style="margin-bottom: 2rem">User Management</h1>
            <div class="management-container">
                <div class="item-row" style="background: rgba(255,255,255,0.05); font-weight: 600;">
                    <div>ID</div>
                    <div>Full Name</div>
                    <div>Email/Username</div>
                    <div>Role</div>
                    <div>Actions</div>
                </div>
                <div id="admin-user-list"></div>
            </div>
        </div>
    `,

    Register: (mode = 'user') => `
        <div class="auth-container fade-in">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Join CampusReclaim</h1>
                    <p>Create your ${mode === 'admin' ? 'Administrator' : 'User'} portal account</p>
                </div>

                <div style="display: flex; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 4px; margin-bottom: 2rem; border: 1px solid var(--glass-border);">
                    <button id="user-tab-reg" class="nav-btn ${mode === 'user' ? 'active' : ''}" style="flex:1; justify-content:center; border-radius: 8px;" onclick="Views.toggleRegisterMode('user')">
                        <i class="fa-solid fa-user"></i> User
                    </button>
                    <button id="admin-tab-reg" class="nav-btn ${mode === 'admin' ? 'active' : ''}" style="flex:1; justify-content:center; border-radius: 8px;" onclick="Views.toggleRegisterMode('admin')">
                        <i class="fa-solid fa-user-shield"></i> Admin
                    </button>
                </div>

                <form onsubmit="Auth.register(event)">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" name="fullName" class="form-input" placeholder="e.g. John Doe" required>
                    </div>
                    <div class="form-group">
                        <label id="reg-email-label" class="form-label">${mode === 'admin' ? 'Admin ID / Email' : 'University Email'}</label>
                        <input type="text" name="email" class="form-input" placeholder="${mode === 'admin' ? 'e.g. admin_new' : 'student@university.ac.lk'}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-input" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn-primary" id="reg-btn">${mode === 'admin' ? 'Register Admin Account' : 'Create My Account'}</button>
                    <div class="auth-switch">
                        Already have an account? <span class="auth-link" onclick="Router.navigate('login')">Login</span>
                    </div>
                </form>
            </div>
        </div>
    `,

    toggleRegisterMode: (mode) => {
        const btn = document.getElementById('reg-btn');
        const userTab = document.getElementById('user-tab-reg');
        const adminTab = document.getElementById('admin-tab-reg');
        const label = document.getElementById('reg-email-label');
        const input = document.querySelector('input[name="email"]');

        if (mode === 'admin') {
            btn.innerText = 'Register Admin Account';
            adminTab.classList.add('active');
            userTab.classList.remove('active');
            if (label) label.innerText = 'Admin ID / Email';
            if (input) input.placeholder = 'e.g. admin_new';
        } else {
            btn.innerText = 'Create My Account';
            userTab.classList.add('active');
            adminTab.classList.remove('active');
            if (label) label.innerText = 'University Email';
            if (input) input.placeholder = 'student@university.ac.lk';
        }
    },

    Dashboard: () => `
        <div class="dashboard-container fade-in">
            <div class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">Report. Recover. Reclaim.</h1>
                    <p class="hero-subtitle">Connecting the campus community to reunite owners with their lost belongings.</p>
                    
                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-number" id="stats-total">0</div>
                            <div class="stat-label">Reports</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" id="stats-found" style="color:var(--primary)">0</div>
                            <div class="stat-label">Found</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="feed-header">
                <h2>Public Feed</h2>
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="search" class="search-input" placeholder="Search for items..." onkeyup="DashboardLogic.filter(this.value)">
                </div>
            </div>

            <div id="items-grid" class="items-grid">
                <p style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">Loading items...</p>
            </div>
        </div>
    `,

    MyItems: () => `
        <div class="dashboard-container fade-in">
            <h1 style="margin-bottom: 2rem">My Reported Items</h1>
            <div class="management-container">
                <div class="item-row" style="background: rgba(255,255,255,0.05); font-weight: 600; font-size: 0.9rem">
                    <div>Image</div>
                    <div>Item Name</div>
                    <div class="hide-mobile">Date</div>
                    <div class="hide-mobile">Status</div>
                    <div>Actions</div>
                </div>
                <div id="my-items-list">
                     <p style="padding: 2rem; text-align:center; color:var(--text-muted)">Loading your reports...</p>
                </div>
            </div>
        </div>
    `,

    Analytics: () => `
        <div class="dashboard-container fade-in">
            <h1 style="margin-bottom: 2rem">Campus Impact Analytics</h1>
            <div class="analytics-grid">
                <div class="analytics-card">
                    <div class="analytics-icon"><i class="fa-solid fa-earth-americas"></i></div>
                    <div class="analytics-val" id="total-val">0</div>
                    <div class="analytics-content">Total Ecosystem Reports</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon"><i class="fa-solid fa-hands-holding"></i></div>
                    <div class="analytics-val" id="found-val" style="color:var(--success)">0</div>
                    <div class="analytics-content">Items Found & Listed</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon"><i class="fa-solid fa-check-double"></i></div>
                    <div class="analytics-val" id="resolved-val" style="color:var(--primary-dark)">0</div>
                    <div class="analytics-content">Cases Resolved</div>
                </div>
            </div>

            <div class="hero-section" style="padding: 3rem; background: var(--bg-card)">
                 <h2 style="margin-bottom: 1rem">Community Success Stories</h2>
                 <p style="color: var(--text-muted)">Since Launch, CampusReclaim has helped reconnect 85% of reported essential documents (IDs/Wallets) within 24 hours.</p>
            </div>
        </div>
    `,

    Report: () => `
        <div class="report-container fade-in">
            <div class="report-card">
                <div class="report-header">
                    <h1>Report an Item</h1>
                    <p>Provide accurate details to help with recovery.</p>
                </div>
                <form onsubmit="DashboardLogic.submitItem(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select name="type" class="form-input" required>
                                <option value="Lost">I Lost something</option>
                                <option value="Found">I Found something</option>
                            </select>
                        </div>
                         <div class="form-group">
                            <label class="form-label">Category</label>
                            <select name="category" class="form-input" required>
                                <option value="Electronics">Electronics</option>
                                <option value="Documents">Documents/IDs</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Item Name</label>
                        <input type="text" name="title" class="form-input" placeholder="e.g. Black AirPods Pro" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea name="description" class="form-input" placeholder="Distinguishing marks, color, brand..." required></textarea>
                    </div>

                    <div class="form-row">
                         <div class="form-group">
                            <label class="form-label">Location</label>
                            <input type="text" name="location" class="form-input" placeholder="e.g. Science Lecture Hall" required>
                        </div>
                         <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" name="date" class="form-input" required>
                        </div>
                    </div>
                     <div class="form-group" style="margin-top: 1rem;">
                        <label class="form-label">Contact Phone Number</label>
                        <input type="tel" name="contact_phone" class="form-input" placeholder="e.g. 077 123 4567" required>
                    </div>

                     <div class="form-group">
                        <label class="form-label">Upload Photo (from your computer)</label>
                        <input type="file" name="image" class="form-input" accept="image/*">
                        <small style="color:var(--text-muted)">* Select a file from your C or D drive.</small>
                    </div>

                    <button type="submit" class="btn-primary">Submit Report</button>
                </form>
            </div>
        </div>
    `,

    Profile: () => {
        const user = Store.getUser();
        const profilePic = user.profile_pic ? user.profile_pic : '';
        return `
        <div class="dashboard-container fade-in">
            <div class="hero-section" style="padding: 2rem; background: var(--bg-card); display: flex; align-items: center; gap: 2rem; text-align: left;">
                <div style="position: relative; width: 120px; height: 120px;">
                    <div id="profile-pic-container" style="width: 120px; height: 120px; border-radius: 50%; background-color: var(--primary); background-image: ${profilePic ? `url('${profilePic}')` : 'none'}; background-size: cover; background-position: center; color: #1e262b; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; border: 4px solid var(--glass-border); overflow: hidden;">
                        ${!profilePic ? '<i class="fa-solid fa-user"></i>' : ''}
                    </div>
                    <label for="profile_pic_input" style="position: absolute; bottom: 0; right: 0; width: 35px; height: 35px; background: var(--primary); color: #1e262b; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid var(--bg-card); transition: transform 0.2s;">
                        <i class="fa-solid fa-camera"></i>
                    </label>
                    <input type="file" id="profile_pic_input" style="display: none;" accept="image/*" onchange="DashboardLogic.uploadProfilePic(this)">
                </div>
                <div style="flex: 1">
                    <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                            <h1 id="p-name" style="margin: 0;">${user.name}</h1>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="contact-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="DashboardLogic.showEditProfile()"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                                <button class="contact-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-color: var(--primary-dark); color: var(--text-muted)" onclick="Router.navigate('account-settings')" title="Security Settings"><i class="fa-solid fa-shield-halved"></i> Settings</button>
                            </div>
                        </div>
                        <p style="color: var(--text-muted); margin-bottom: 0.5rem;"><i class="fa-solid fa-envelope"></i> ${user.email}</p>
                    </div>
                    
                    <div style="margin: 1rem 0; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 0.5rem; border-left: 4px solid var(--primary);">
                        <div style="font-size: 0.8rem; color: var(--primary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem;">About Me</div>
                        <p id="p-bio" style="font-size: 0.95rem; line-height: 1.5;">${user.bio || 'Tell the community about yourself...'}</p>
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <span class="status-chip status-active" id="profile-stat-active">0 Active</span>
                        <span class="status-chip" style="background: rgba(0, 245, 212, 0.1); color: var(--primary)" id="profile-stat-total">0 Total</span>
                    </div>
                </div>
            </div>

            <h2 style="margin: 3rem 0 1.5rem"><i class="fa-solid fa-clock-rotate-left"></i> My Activity History</h2>
            
            <div class="management-container">
                <div class="item-row" style="background: rgba(255,255,255,0.05); font-weight: 600; font-size: 0.9rem">
                    <div>Image</div>
                    <div>Item Details</div>
                    <div class="hide-mobile">Type</div>
                    <div class="hide-mobile">Status</div>
                    <div>Actions</div>
                </div>
                <div id="profile-history-list">
                    <p style="padding: 2rem; text-align:center; color:var(--text-muted)">Loading your history...</p>
                </div>
            </div>
        </div>
        `;
    },

    AccountSettings: () => {
        const user = Store.getUser();
        return `
        <div class="report-container fade-in">
            <div class="report-card">
                <div class="report-header">
                    <h1>Account Security</h1>
                    <p>Update your credentials below</p>
                </div>
                <form onsubmit="DashboardLogic.saveAccount(event)">
                    <div class="form-group">
                        <label class="form-label">Username / Email</label>
                        <input type="text" name="email" class="form-input" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password (leave blank to keep current)</label>
                        <input type="password" name="password" class="form-input" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" name="confirm_password" class="form-input" placeholder="••••••••">
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                         <button type="button" class="btn-primary" style="background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--glass-border);" onclick="Router.navigate('profile')">Back to Profile</button>
                         <button type="submit" class="btn-primary">Update Account</button>
                    </div>
                </form>
            </div>
        </div>
        `;
    },

    Messages: () => `
        <div class="container fade-in" style="margin-top: 3rem;">
            <div class="header-section" style="margin-bottom: 2rem;">
                <h1>Your Notifications</h1>
                <p>Track responses to your lost or found reports</p>
            </div>
            
            <div id="messages-list" class="messages-container" style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="text-align:center; padding: 3rem; color: var(--text-muted)">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Loading your messages...</p>
                </div>
            </div>
        </div>
    `,
    EditProfileModal: (user) => `
    <div class="details-overlay fade-in" id="edit-profile-modal" onclick="if(event.target === this) this.remove()">
        <div class="auth-card" style="max-width: 500px; width: 90%;">
            <div class="auth-header">
                <h2>Edit Profile</h2>
                <p>Update your personal information</p>
            </div>
            <form onsubmit="DashboardLogic.saveProfile(event)">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" name="full_name" class="form-input" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">About / Bio</label>
                    <textarea name="bio" class="form-input" style="min-height: 120px" placeholder="Write something about yourself...">${user.bio || ''}</textarea>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button type="button" class="btn-primary" style="background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--glass-border);" onclick="document.getElementById('edit-profile-modal').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
        </div>
    `,

    ItemDetailPage: (item) => {
        const user = Store.getUser();
        const isOwner = user && user.id == item.user_id;
        const isAdmin = user && user.role === 'admin';
        const isResolved = item.status === 'Resolved';

        // Action Button Logic
        let actionButton = '';
        if (isResolved) {
            actionButton = `<div class="status-chip status-resolved" style="width:100%; text-align:center; padding: 1rem; font-size: 1.1rem;">
                                <i class="fa-solid fa-check-double"></i> This case is Resolved
                            </div>`;
        } else if (isOwner || isAdmin) {
            actionButton = `<button class="btn-primary" style="width:100%; background: var(--success);" onclick="DashboardLogic.resolveItem(${item.id})">
                                <i class="fa-solid fa-check"></i> Mark as Resolved / Found
                            </button>`;
        } else if (user) {
            if (item.type === 'Lost') {
                actionButton = `<button class="btn-primary" style="width:100%;" onclick="DashboardLogic.autoNotify(${item.id}, ${item.user_id})">
                                    <i class="fa-solid fa-paper-plane"></i> I Found This! (Quick Notify)
                                </button>`;
            } else {
                actionButton = `<button class="btn-primary" style="width:100%;" onclick="DashboardLogic.autoNotify(${item.id}, ${item.user_id})">
                                    <i class="fa-solid fa-bullhorn"></i> This is My Item (Claim)
                                </button>`;
            }
        } else {
            actionButton = `<button class="btn-primary" style="width:100%;" onclick="Router.navigate('login')">
                                <i class="fa-solid fa-right-to-bracket"></i> Login to Contact Reporter
                            </button>`;
        }

        return `
        <div class="dashboard-container fade-in">
            <button class="contact-btn" style="margin-bottom: 2rem;" onclick="Router.navigate('dashboard')">
                <i class="fa-solid fa-arrow-left"></i> Back to Feed
            </button>

            <div class="item-page-layout">
                <div class="item-page-image">
                    <img src="${item.image_url || 'https://placehold.co/800x600/1e293b/FFF?text=No+Image'}" style="width:100%; border-radius: 1.5rem; border: 1px solid var(--glass-border);">
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <span class="item-badge ${item.type === 'Lost' ? 'badge-lost' : 'badge-found'}" style="position:static;">${item.type}</span>
                        <span class="status-chip ${item.status === 'Active' ? 'status-active' : 'status-resolved'}" style="position:static;">${item.status}</span>
                    </div>
                </div>

                <div class="item-page-details">
                    <h1 style="font-size: 2.5rem; margin-bottom: 1.5rem;">${item.title}</h1>
                    
                    <div class="modal-meta-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                         <div class="meta-item">
                            <i class="fa-regular fa-calendar"></i>
                            <div>
                                <small>Date ${item.type === 'Lost' ? 'Lost' : 'Found'}</small>
                                <span>${item.event_date}</span>
                            </div>
                         </div>
                         <div class="meta-item">
                            <i class="fa-solid fa-location-dot"></i>
                            <div>
                                <small>Location</small>
                                <span>${item.location}</span>
                            </div>
                         </div>
                         <div class="meta-item">
                            <i class="fa-solid fa-tag"></i>
                            <div>
                                <small>Category</small>
                                <span>${item.category}</span>
                            </div>
                         </div>
                         <div class="meta-item">
                            <i class="fa-solid fa-phone"></i>
                            <div>
                                <small>Reporter Phone</small>
                                <span>${item.contact_phone || 'Not Shared'}</span>
                            </div>
                         </div>
                    </div>

                    <div style="margin: 2.5rem 0; padding: 2rem; background: rgba(255,255,255,0.03); border-radius: 1rem; border: 1px solid var(--glass-border);">
                        <h4 style="color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1rem;">Full Description</h4>
                        <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-muted); white-space: pre-wrap;">${item.description}</p>
                    </div>

                    <div class="reporter-card" style="background: var(--bg-card); padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--glass-border);">
                        <div style="display: flex; align-items: center; gap: 1rem">
                            <div class="reporter-avatar" style="width:60px; height:60px; font-size: 1.5rem;">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.2rem;">${item.reporter_name}</div>
                                <div style="font-size: 0.9rem; color: var(--text-muted)">Verified Campus Member</div>
                            </div>
                        </div>
                        <div style="margin-top: 2rem;">
                            ${actionButton}
                        </div>
                    </div>

                    ${!isResolved && !isOwner && item.type === 'Lost' ? `
                    <div style="margin-top: 3rem; padding: 2rem; background: rgba(0, 245, 212, 0.05); border-radius: 1.5rem; border: 1px solid var(--glass-border);">
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary);">Did you find this? Message the owner</h3>
                        <form onsubmit="DashboardLogic.submitFoundReport(event, ${item.id}, ${item.user_id})">
                            <div class="form-row" style="margin-bottom: 1.5rem;">
                                <div class="form-group">
                                    <label class="form-label">When did you find it?</label>
                                    <input type="date" name="found_date" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Your Phone Number</label>
                                    <input type="tel" name="finder_phone" class="form-input" placeholder="07x xxxxxxx" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Specific Location where found</label>
                                <input type="text" name="found_location" class="form-input" placeholder="e.g. Ground floor behind the lift" required>
                            </div>
                            <div class="form-group" style="margin-top: 1.5rem;">
                                <label class="form-label">Message to Owner</label>
                                <textarea name="message" class="form-input" placeholder="e.g. I have it safely with me. We can meet up..." style="min-height: 100px;"></textarea>
                            </div>
                            <button type="submit" class="btn-primary" style="margin-top: 2rem; height: 3.5rem; font-size: 1.1rem;">Submit Discovery Notification</button>
                        </form>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    }
};

// --- CONTROLLERS ---
const DashboardLogic = {
    itemList: [],

    init: async () => {
        try {
            const res = await fetch('api_items.php?t=' + Date.now());
            const data = await res.json();
            DashboardLogic.itemList = Array.isArray(data) ? data : [];

            if (Router.currentRoute === 'my-items') {
                DashboardLogic.renderMyItems();
            } else if (Router.currentRoute === 'profile') {
                DashboardLogic.renderProfile();
            } else if (Router.currentRoute === 'analytics') {
                DashboardLogic.renderAnalytics();
            } else if (Router.currentRoute === 'dashboard') {
                DashboardLogic.renderItems(DashboardLogic.itemList);
                DashboardLogic.updateStats();
            }
        } catch (err) {
            console.error(err);
            // Only show error on dashboard if it's the current route
            if (Router.currentRoute === 'dashboard') {
                const grid = document.getElementById('items-grid');
                if (grid) grid.innerHTML = '<p style="color:red; grid-column: 1/-1; text-align:center;">Failed to load items. Is the PHP server running?</p>';
            }
        }
    },

    updateStats: () => {
        const items = DashboardLogic.itemList;
        const total = document.getElementById('stats-total');
        const found = document.getElementById('stats-found');

        // On dashboard, we show Active counts to emphasize current work
        const activeItems = items.filter(i => i.status === 'Active');
        if (total) total.innerText = activeItems.length;
        if (found) found.innerText = activeItems.filter(i => i.type === 'Found').length;
    },

    renderAnalytics: () => {
        const items = DashboardLogic.itemList;
        const total = document.getElementById('total-val');
        const found = document.getElementById('found-val');
        const resolved = document.getElementById('resolved-val');

        // Analytics show Active reports vs total success stories
        if (total) total.innerText = items.filter(i => i.status === 'Active').length;
        if (found) found.innerText = items.filter(i => i.type === 'Found' && i.status === 'Active').length;
        if (resolved) resolved.innerText = items.filter(i => i.status === 'Resolved').length;
    },

    renderMyItems: () => {
        const user = Store.getUser();
        const list = document.getElementById('my-items-list');
        if (!list) return;

        const myItems = DashboardLogic.itemList.filter(i => i.user_id == user.id);

        if (myItems.length === 0) {
            list.innerHTML = '<p style="padding: 3rem; text-align:center; color:var(--text-muted)">You haven\'t reported any items yet.</p>';
            return;
        }

        list.innerHTML = myItems.map(item => `
                <div class="item-row">
                    <img src="${item.image_url || 'https://placehold.co/100x100/1e293b/FFF?text=No+Img'}">
                    <div style="font-weight: 500">${item.title}</div>
                    <div class="hide-mobile" style="color: var(--text-muted)">${item.event_date}</div>
                    <div class="hide-mobile">
                        <span class="status-chip ${item.status === 'Active' ? 'status-active' : 'status-resolved'}">${item.status}</span>
                    </div>
                    <div class="action-btns">
                        <button class="btn-icon resolve" title="Mark as Resolved" onclick="DashboardLogic.resolveItem(${item.id})">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button class="btn-icon delete" title="Delete" onclick="DashboardLogic.deleteItem(${item.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
    },

    renderProfile: () => {
        const user = Store.getUser();
        const list = document.getElementById('profile-history-list');
        if (!list) return;

        const myItems = DashboardLogic.itemList.filter(i => i.user_id == user.id);

        // Update Stats
        const activeCount = myItems.filter(i => i.status === 'Active').length;
        document.getElementById('profile-stat-active').innerText = `${activeCount} Active`;
        document.getElementById('profile-stat-total').innerText = `${myItems.length} Total Reports`;

        if (myItems.length === 0) {
            list.innerHTML = '<p style="padding: 3rem; text-align:center; color:var(--text-muted)">No activity found in your history.</p>';
            return;
        }

        list.innerHTML = myItems.map(item => `
    <div class="item-row">
        <img src="${item.image_url || 'https://placehold.co/100x100/1e293b/FFF?text=No+Img'}">
            <div>
                <div style="font-weight: 600">${item.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted)">${item.event_date} • ${item.location}</div>
            </div>
            <div class="hide-mobile">
                <span class="item-badge ${item.type === 'Lost' ? 'badge-lost' : 'badge-found'}" style="position:static; padding: 0.2rem 0.5rem; font-size: 0.65rem;">${item.type}</span>
            </div>
            <div class="hide-mobile">
                <span class="status-chip ${item.status === 'Active' ? 'status-active' : 'status-resolved'}">${item.status}</span>
            </div>
            <div class="action-btns">
                ${item.status === 'Active' ? `
                        <button class="btn-icon resolve" title="Mark as Resolved" onclick="DashboardLogic.resolveItem(${item.id})">
                            <i class="fa-solid fa-check"></i>
                        </button>
                    ` : ''}
                <button class="btn-icon delete" title="Delete Permanentely" onclick="DashboardLogic.deleteItem(${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
`).join('');
    },

    uploadProfilePic: async (input) => {
        const file = input.files[0];
        if (!file) return;

        const user = Store.getUser();
        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('profile_pic', file);

        try {
            const res = await fetch('api_user.php', {
                method: 'POST',
                body: formData
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Invalid JSON response:', text);
                const snippet = text.substring(0, 50).replace(/<[^>]*>?/gm, '');
                throw new Error(`Server Error: ${snippet}...`);
            }

            if (data.status === 'success') {
                // Update local store
                user.profile_pic = data.url;
                Store.setUser(user);

                // Update UI immediately
                const container = document.getElementById('profile-pic-container');
                if (container) {
                    container.style.backgroundImage = `url('${data.url}')`;
                    container.style.backgroundSize = 'cover';
                    container.style.backgroundPosition = 'center';
                    container.innerHTML = ''; // Remove icon
                }
                Toast.show('Profile picture updated!', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            Toast.show('Error uploading picture: ' + err.message, 'error');
        }
    },

    showEditProfile: () => {
        const user = Store.getUser();
        document.body.insertAdjacentHTML('beforeend', Views.EditProfileModal(user));
    },

    saveProfile: async (e) => {
        e.preventDefault();
        const user = Store.getUser();
        const formData = new FormData(e.target);
        formData.append('user_id', user.id);

        try {
            const res = await fetch('api_user.php', {
                method: 'POST',
                body: formData
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                const snippet = text.substring(0, 50).replace(/<[^>]*>?/gm, '');
                throw new Error(`Server Error: ${snippet}...`);
            }

            if (data.status === 'success') {
                user.name = formData.get('full_name');
                user.bio = formData.get('bio');
                Store.setUser(user);

                // Update UI
                const nameEl = document.getElementById('p-name');
                const bioEl = document.getElementById('p-bio');
                if (nameEl) nameEl.innerText = user.name;
                if (bioEl) bioEl.innerText = user.bio || 'Tell the community about yourself...';

                document.getElementById('edit-profile-modal').remove();
                Toast.show('Profile updated!', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            Toast.show(err.message, 'error');
        }
    },

    deleteItem: async (id) => {
        if (!confirm('Are you sure you want to delete this report?')) return;
        try {
            const res = await fetch('api_items.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                Toast.show('Report deleted', 'success');
                DashboardLogic.init();
            } else {
                throw new Error(data.message);
            }
        } catch (err) { Toast.show('Error deleting item: ' + err.message, 'error'); }
    },

    resolveItem: async (id, extraData = {}) => {
        try {
            const body = { id, status: 'Resolved', action: 'status_update', ...extraData };
            const res = await fetch('api_items.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.status === 'success') {
                Toast.show('Item marked as recovered!', 'success');
                await DashboardLogic.init();
            } else {
                throw new Error(data.message);
            }
        } catch (err) { Toast.show('Error updating item: ' + err.message, 'error'); }
    },

    renderItems: (items) => {
        const grid = document.getElementById('items-grid');
        if (!grid) return;

        // Show only Active items on the dashboard
        let displayItems = items.filter(i => i.status === 'Active');

        // Sort: Active first, then Resolved
        displayItems.sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === 'Active' ? -1 : 1;
        });

        if (displayItems.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">No items matching your search.</p>';
            return;
        }

        grid.innerHTML = displayItems.map(item => `
    <div class="item-card fade-in ${item.status === 'Resolved' ? 'resolved-card' : ''}" onclick="DashboardLogic.viewDetail(${item.id})">
                <div class="item-image" style="background-image: url('${item.image_url || 'https://placehold.co/600x400/1e293b/FFF?text=No+Image'}'); background-size: cover; background-position: center;">
                    <span class="item-badge ${item.status === 'Resolved' ? 'badge-resolved' : (item.type === 'Lost' ? 'badge-lost' : 'badge-found')}">${item.status === 'Resolved' ? 'Recovered' : item.type}</span>
                </div>
                <div class="item-details">
                    <h3 class="item-title">${item.title}</h3>
                    <div class="item-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${item.event_date}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${item.location}</span>
                    </div>
                    <p class="item-desc">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
                    <div class="card-footer">
                        <div class="user-info">
                            <i class="fa-solid fa-user-circle"></i> ${item.reporter_name}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${item.status === 'Active' && Store.getUser() && Store.getUser().id != item.user_id ? `
                                <button class="contact-btn" style="background: var(--primary); color: #000;" onclick="event.stopPropagation(); DashboardLogic.autoNotify(${item.id}, ${item.user_id})">
                                    ${item.type === 'Lost' ? 'Found it!' : 'Claim'}
                                </button>
                            ` : ''}
                            <button class="contact-btn">View</button>
                        </div>
                    </div>
                </div>
            </div>
    `).join('');
    },

    viewDetail: (id) => {
        Router.navigate('view-item', id);
    },

    closeModal: () => {
        // Obsolete but kept for compat if needed temporarily
        const modal = document.getElementById('active-modal-overlay');
        if (modal) modal.remove();
        document.body.style.overflow = 'auto';
    },

    filter: (query) => {
        const term = query.toLowerCase();
        const filtered = DashboardLogic.itemList.filter(i =>
            i.title.toLowerCase().includes(term) ||
            i.description.toLowerCase().includes(term) ||
            i.category.toLowerCase().includes(term) ||
            i.location.toLowerCase().includes(term)
        );
        DashboardLogic.renderItems(filtered);
    },

    submitItem: async (e) => {
        e.preventDefault();
        const user = Store.getUser();
        const formData = new FormData(e.target);
        formData.append('user_id', user.id);

        try {
            const res = await fetch('api_items.php', {
                method: 'POST',
                // Note: Don't set Content-Type header when using FormData
                body: formData
            });
            const result = await res.json();

            if (result.status === 'success') {
                Toast.show('Item reported successfully!', 'success');
                Router.navigate('dashboard');
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            Toast.show(err.message, 'error');
        }
    },

    saveAccount: async (e) => {
        e.preventDefault();
        const user = Store.getUser();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirm = formData.get('confirm_password');

        if (password && password !== confirm) {
            Toast.show('Passwords do not match', 'error');
            return;
        }

        formData.append('user_id', user.id);

        try {
            const res = await fetch('api_user.php', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.status === 'success') {
                user.email = email;
                Store.setUser(user);
                Toast.show('Account security updated!', 'success');
                Router.navigate('profile');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            Toast.show(err.message, 'error');
        }
    },

    submitFoundReport: async (e, itemId, receiverId) => {
        e.preventDefault();
        const user = Store.getUser();
        if (!user) {
            Toast.show('Please login to report findings', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const res = await fetch('api_messages.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: itemId,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    message: data.message || `I found your item: ${data.found_location}`,
                    found_date: data.found_date,
                    found_location: data.found_location,
                    finder_phone: data.finder_phone
                })
            });
            const result = await res.json();

            if (result.status === 'success') {
                Toast.show('Message sent to the owner! They will contact you shortly.', 'success');

                // Automatically mark as Resolved (Recovered) so it shows correctly on Home
                await DashboardLogic.resolveItem(itemId);

                // Navigate back to dashboard or refresh the item page
                Router.navigate('view-item', itemId);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            Toast.show('Failed to send message: ' + err.message, 'error');
        }
    },

    autoNotify: async (itemId, receiverId) => {
        const user = Store.getUser();
        if (!user) {
            Toast.show('Please login to notify the reporter', 'error');
            Router.navigate('login');
            return;
        }

        const item = DashboardLogic.itemList.find(i => i.id == itemId);
        if (!item) return;

        let message = '';
        if (item.type === 'Found') {
            message = `Hello! I believe the item "${item.title}" you found belongs to me. Let's connect!`;
        } else {
            message = `Good news! I found your lost item: "${item.title}". Please contact me to get it back.`;
        }

        try {
            const res = await fetch('api_messages.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: itemId,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    message: message,
                    found_date: new Date().toISOString().split('T')[0],
                    found_location: 'Quick Notify (Web Portal)',
                    finder_phone: 'Pending'
                })
            });
            const result = await res.json();

            if (result.status === 'success') {
                Toast.show('Automatic message sent to the reporter!', 'success');

                // Mark as Resolved (Recovered) so it disappears from the feed
                await DashboardLogic.resolveItem(itemId);

                // Refresh viewing the item
                Router.navigate('view-item', itemId);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            Toast.show('Failed to send auto-notify: ' + err.message, 'error');
        }
    },

    fetchMessages: async () => {
        const user = Store.getUser();
        const list = document.getElementById('messages-list');
        if (!list) return;

        try {
            const res = await fetch(`api_messages.php?user_id=${user.id}&t=${Date.now()}`);
            const messages = await res.json();

            if (messages.length === 0) {
                list.innerHTML = `
                    <div style="text-align:center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: 1rem; border: 1px solid var(--glass-border);">
                        <i class="fa-solid fa-envelope-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p>No notifications yet. You'll be notified when someone finds your lost items.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = messages.map(msg => `
                <div class="message-card ${msg.status}" style="background: var(--bg-card); padding: 1.5rem; border-radius: 1rem; border: 1px solid ${msg.status === 'unread' ? 'var(--primary)' : 'var(--glass-border)'}; display: flex; flex-direction: column; gap: 0.5rem; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 style="color: var(--primary); margin: 0;">Found Report: ${msg.item_title}</h3>
                        <span style="font-size: 0.75rem; color: var(--text-muted)">${new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p style="margin: 0.5rem 0; font-size: 1.05rem;">"${msg.message}"</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); margin-top: 0.5rem;">
                        <div>
                            <small style="color: var(--text-muted); display: block;">Found At</small>
                            <span>${msg.found_location} on ${msg.found_date}</span>
                        </div>
                        <div>
                            <small style="color: var(--text-muted); display: block;">Claimant</small>
                            <span>${msg.sender_name}</span>
                        </div>
                        <div>
                            <small style="color: var(--text-muted); display: block;">Contact Finder</small>
                            <a href="tel:${msg.finder_phone}" style="color: var(--primary); text-decoration: none; font-weight: 600;">
                                <i class="fa-solid fa-phone"></i> ${msg.finder_phone}
                            </a>
                        </div>
                    </div>
                    ${msg.status === 'unread' ? `
                        <button onclick="DashboardLogic.markMessageRead(${msg.id})" style="position: absolute; top: 1.5rem; right: 1.5rem; background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 0.5rem; font-size: 0.7rem; cursor: pointer;">
                            Mark Read
                        </button>
                    ` : ''}
                </div>
            `).join('');
        } catch (err) {
            list.innerHTML = `<p style="color: var(--error); text-align: center;">Error loading messages: ${err.message}</p>`;
        }
    },

    markMessageRead: async (msgId) => {
        try {
            await fetch('api_messages.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_id: msgId })
            });
            DashboardLogic.fetchMessages();
        } catch (err) { console.error(err); }
    },
};

const AdminLogic = {
    init: async () => {
        const admin = Store.getUser();
        try {
            // Load Stats
            const statRes = await fetch(`api_admin.php?action=stats&admin_id=${admin.id}`);
            const stats = await statRes.json();
            document.getElementById('adm-total-users').innerText = stats.total_users;
            document.getElementById('adm-total-items').innerText = stats.total_items;
            document.getElementById('adm-resolved').innerText = stats.resolved_items;

            // Load Items (Reusing DashboardLogic)
            await DashboardLogic.init();
        } catch (e) {
            Toast.show('Error loading admin data', 'error');
        }
    },

    loadUsers: async () => {
        const admin = Store.getUser();
        const list = document.getElementById('admin-user-list');
        try {
            const res = await fetch(`api_admin.php?action=users&admin_id=${admin.id}`);
            const users = await res.json();

            list.innerHTML = users.map(user => `
                <div class="item-row">
                    <div>#${user.id}</div>
                    <div style="font-weight:600">${user.full_name}</div>
                    <div style="color:var(--text-muted)">${user.email}</div>
                    <div><span class="status-chip ${user.role === 'admin' ? 'status-active' : ''}">${user.role}</span></div>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="AdminLogic.deleteUser(${user.id})" ${user.id == admin.id ? 'disabled' : ''}>
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            Toast.show('Error loading users', 'error');
        }
    },

    deleteUser: async (id) => {
        if (!confirm('Permanentely delete this user and all their reports?')) return;
        const admin = Store.getUser();
        try {
            const res = await fetch('api_admin.php', {
                method: 'DELETE',
                body: JSON.stringify({ admin_id: admin.id, user_id: id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                Toast.show('User deleted', 'success');
                AdminLogic.loadUsers();
            } else {
                Toast.show(data.message, 'error');
            }
        } catch (e) { Toast.show('Action failed', 'error'); }
    }
};

const Toast = {
    show: (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// --- WINDOW ATTACHMENTS (For HTML Event Handlers) ---
window.Store = Store; window.store = Store;
window.Auth = Auth; window.auth = Auth;
window.Router = Router; window.router = Router;
window.Views = Views; window.views = Views;
window.DashboardLogic = DashboardLogic; window.dashboardLogic = DashboardLogic;
window.AdminLogic = AdminLogic; window.adminLogic = AdminLogic;
window.Toast = Toast; window.toast = Toast;

window.addEventListener('DOMContentLoaded', () => {
    try {
        Auth.init();
    } catch (e) {
        console.error('App initialization failed:', e);
    }
});
