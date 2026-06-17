'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Badge from '@/components/Badge';
import Icon from '@/components/Icon';
import {
  UserGroupIcon,
  Add01Icon,
  Delete02Icon,
  Mail01Icon,
  Cancel01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';

const ROLES = ['manager', 'support', 'viewer'];

const roleVariant = (r) =>
  r === 'manager' ? 'info' : r === 'support' ? 'warning' : 'default';

function InviteModal({ onClose, onInvited }) {
  const [form, setForm] = useState({ email: '', name: '', role: 'viewer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { setError('Email is required'); return; }
    setLoading(true);
    setError('');
    try {
      await apiClient.inviteTeamMember(form);
      onInvited();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-[420px] rounded-2xl p-6 anim-scale"
        style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base" style={{ color: 'var(--text-base)' }}>Invite team member</h2>
          <button onClick={onClose} className="ts-btn-ghost ts-btn-sm p-2">
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Full name
            </label>
            <input value={form.name} onChange={set('name')} placeholder="Jane Smith" className="ts-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email address *
            </label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" className="ts-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Role
            </label>
            <select value={form.role} onChange={set('role')} className="ts-input capitalize">
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Manager can edit products and view orders. Support can view orders. Viewer is read-only.
            </p>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="ts-btn-secondary flex-1">Cancel</button>
            <button type="submit" className="ts-btn-primary flex-1" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Icon icon={Mail01Icon} size={15} />
                  Send invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberCard({ member, onRemove, onRoleChange }) {
  const [changingRole, setChangingRole] = useState(false);

  const handleRole = async (role) => {
    setChangingRole(true);
    try {
      await apiClient.updateTeamMemberRole(member.id, role);
      onRoleChange(member.id, role);
    } catch (err) {
      alert(err.message);
    } finally {
      setChangingRole(false);
    }
  };

  const initials = (member.name || member.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="ts-card p-5 flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
        style={{ background: 'var(--grad-primary)' }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-base)' }}>
            {member.name || 'Unnamed'}
          </p>
          <Badge variant={roleVariant(member.role)}>{member.role}</Badge>
          {member.status === 'pending' && <Badge variant="warning" dot>pending invite</Badge>}
        </div>
        <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
        {member.joined_at && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Joined {new Date(member.joined_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <select
          value={member.role}
          onChange={(e) => handleRole(e.target.value)}
          disabled={changingRole}
          className="ts-input ts-btn-sm py-1.5 w-auto text-xs capitalize"
          style={{ width: '108px' }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">{r}</option>
          ))}
        </select>
        <button
          onClick={() => onRemove(member)}
          className="ts-btn-ghost ts-btn-sm p-2"
          style={{ color: 'var(--danger-text)' }}
          title="Remove member"
        >
          <Icon icon={Delete02Icon} size={15} />
        </button>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.getTeam()
      .then((res) => setMembers(res.data ?? res.members ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (member) => {
    if (!confirm(`Remove ${member.name || member.email} from your team?`)) return;
    try {
      await apiClient.removeTeamMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRoleChange = (id, role) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-base)' }}>Team</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage who has access to your seller dashboard.
          </p>
        </div>
        <button onClick={() => setShowInvite(true)} className="ts-btn-primary ts-btn-sm">
          <Icon icon={Add01Icon} size={15} />
          Invite member
        </button>
      </div>

      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'var(--info-bg)', boxShadow: '0 0 0 1px var(--info-border)' }}
      >
        <Icon icon={UserGroupIcon} size={16} style={{ color: 'var(--info-text)', marginTop: '1px' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--info-text)' }}>Team roles</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            <strong>Manager</strong> — Can manage products and view orders.&nbsp;
            <strong>Support</strong> — Can view orders only.&nbsp;
            <strong>Viewer</strong> — Read-only access to analytics and products.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="ts-skeleton h-[88px] rounded-2xl" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="ts-card flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-overlay)' }}
          >
            <Icon icon={UserIcon} size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--text-base)' }}>No team members yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Invite people to help manage your store.</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="ts-btn-primary ts-btn-sm">
            <Icon icon={Add01Icon} size={15} />
            Invite someone
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-muted)' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onRemove={handleRemove}
              onRoleChange={handleRoleChange}
            />
          ))}
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); load(); }}
        />
      )}
    </div>
  );
}
