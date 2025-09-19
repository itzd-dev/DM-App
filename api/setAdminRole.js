// api/setAdminRole.js
import { getSupabaseAdmin } from './_utils/supabaseAdmin.js';
import { requireAdmin } from './_utils/auth.js';
import { applyCors } from './_utils/cors.js';

const supabase = getSupabaseAdmin();

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client is not initialized. Check server environment variables.' });
  }
  if (!applyCors(req, res, { allowMethods: 'POST,OPTIONS' })) return;
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Only existing admins can set roles
    const adminUser = await requireAdmin(req, res);
    if (!adminUser) return; // response already sent

    if (req.method === 'POST') {
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ message: 'email and role are required.' });
      }

      // Find user by email
      const { data: { users }, error: findError } = await supabase.auth.admin.listUsers({ email });
      if (findError || !users || users.length === 0) {
        return res.status(404).json({ message: 'User not found with that email.' });
      }
      const targetUser = users[0];
      const userId = targetUser.id;

      const currentAppMetadata = targetUser.app_metadata || {};
      let newRoles = Array.isArray(currentAppMetadata.roles) ? [...currentAppMetadata.roles] : [];

      if (role === 'admin') {
        if (!newRoles.includes('admin')) {
          newRoles.push('admin');
        }
      } else if (role === 'buyer') {
        newRoles = newRoles.filter(r => r !== 'admin'); // Remove admin role if setting to buyer
      } else {
        return res.status(400).json({ message: 'Invalid role specified. Must be "admin" or "buyer".' });
      }

      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { app_metadata: { ...currentAppMetadata, roles: newRoles } }
      );

      if (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({ message: 'Failed to update user role.' });
      }

      return res.status(200).json({ message: `User ${userId} role updated to ${newRoles.join(', ')}`, user: data.user });
    }
  } catch (e) {
    console.error('Error in setAdminRole API:', e);
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
}