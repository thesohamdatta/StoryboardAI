import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CreateProjectModal } from '../components/CreateProjectModal';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading projects...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black tracking-tight">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-apple btn-apple-primary"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
          <p className="text-gray-600 mb-6 text-lg">No projects yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-apple btn-apple-primary"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="glass-panel-subtle p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-200 group relative overflow-hidden"
            >
              <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-gray-700 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
                <span className="text-black opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}
