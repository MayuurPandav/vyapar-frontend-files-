import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const roleName = user?.role?.replace('_', ' ').toUpperCase() || 'Staff';

  const navItems = [
    { path: '/', label: 'Dashboard', iconClass: 'fas fa-th-large' },
    { path: '/billing', label: 'Billing', iconClass: 'fas fa-receipt' },
    { path: '/products', label: 'Products', iconClass: 'fas fa-box' },
    { path: '/inventory', label: 'Inventory', iconClass: 'fas fa-boxes-stacked' },
    { path: '/orders', label: 'Orders', iconClass: 'fas fa-cart-shopping' },
    { path: '/customers', label: 'Customers', iconClass: 'fas fa-users' },
    { path: '/deliveries', label: 'Deliveries', iconClass: 'fas fa-truck' },
    { path: '/reports', label: 'Reports', iconClass: 'fas fa-chart-column' },
    { path: '/profile', label: 'My Profile', iconClass: 'fas fa-user-circle' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <i className="fas fa-cube"></i>
        </div>
        <div>
          <span className="sidebar__logo-text">Vyapar</span>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '-4px' }}>
            {roleName}
          </p>
        </div>
      </div>

      <ul className="sidebar__nav">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
              end
            >
              <i className={item.iconClass}></i>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
