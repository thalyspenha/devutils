import { NavLink } from 'react-router-dom';
import { TOOLS } from '../tools';

export function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>DevUtils</h1>
      </div>
      <div className="flex-col">
        {TOOLS.map((tool) => (
          <NavLink
            key={tool.id}
            to={tool.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={tool.path === '/'}
          >
            <tool.icon className="nav-icon" />
            <span>{tool.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
