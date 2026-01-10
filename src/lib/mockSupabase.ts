
// Mock Supabase Client for Development
import { createClient } from '@supabase/supabase-js';

const isDev = import.meta.env.DEV;

// Mock data store
const mockData = {
  users: [
    {
      id: 'mock-user-id',
      email: 'user@example.com',
      role: 'user',
      full_name: 'Mock User',
    },
    {
      id: 'mock-admin-id',
      email: 'admin@example.com',
      role: 'admin',
      full_name: 'Mock Admin',
    }
  ],
  profiles: [
    {
      id: 'mock-profile-id',
      user_id: 'mock-user-id',
      full_name: 'Mock User',
      child_number: '12345',
      is_active: true,
      description: 'Mock Profile Description',
      files: []
    }
  ],
  admins: [
    {
      id: 'mock-admin-entry-id',
      user_id: 'mock-admin-id',
      full_name: 'Mock Admin',
      role: 'admin'
    }
  ]
};

const createMockClient = () => {
  if (!isDev) return null;

  console.log('⚠️ Using Mock Supabase Client');

  return {
    auth: {
      signInWithPassword: async ({ email, password }) => {
        console.log('Mock SignIn:', email);
        
        // Dynamic User Generation for Testing
        let user = mockData.users.find(u => u.email === email);
        
        if (!user) {
          // If user doesn't exist in mock data, create a dynamic one based on email pattern
          const isMockAdmin = email.toLowerCase().includes('admin');
          user = {
            id: isMockAdmin ? 'mock-admin-id' : 'mock-user-id', // Reuse IDs for simplicity with relational lookups
            email: email,
            role: isMockAdmin ? 'admin' : 'user',
            full_name: isMockAdmin ? 'Mock Admin' : 'Mock User',
          };
          console.log('Generated dynamic mock user:', user);
        }
        
        if (user) {
          return {
            data: {
              user: {
                id: user.id,
                email: user.email,
              },
              session: {
                access_token: 'mock-token',
                user: {
                   id: user.id,
                   email: user.email
                }
              }
            },
            error: null
          };
        }
        
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' }
        };
      },
      signOut: async () => {
        console.log('Mock SignOut');
        return { error: null };
      },
      getSession: async () => {
         // Default to not logged in, or mock a session if needed for testing
         // For now, let's assume no active session on refresh to force login
         return { data: { session: null }, error: null };
      },
       admin: {
          createUser: async (params) => {
              console.log('Mock CreateUser:', params);
               return { data: { user: { id: `new-user-${Date.now()}`, ...params } }, error: null };
          },
          deleteUser: async (id) => {
               console.log('Mock DeleteUser:', id);
               return { data: {}, error: null };
          }
      }
    },
    from: (table) => {
      return {
        select: (columns) => {
          return {
            eq: (column, value) => {
              console.log(`Mock Select ${table} where ${column} = ${value}`);
              
              let data = [];
              if (table === 'admins' && column === 'user_id') {
                 data = mockData.admins.filter(a => a.user_id === value);
              } else if (table === 'profiles' && column === 'user_id') {
                 data = mockData.profiles.filter(p => p.user_id === value);
              } else if (table === 'user_roles' && column === 'user_id') {
                 // Mock role fetch
                 const user = mockData.users.find(u => u.id === value);
                 data = user ? [{ role: user.role }] : [];
              }
              
              return {
                single: async () => {
                  return { data: data[0] || null, error: null };
                },
                maybeSingle: async () => {
                   return { data: data[0] || null, error: null };
                },
                then: (cb) => cb({ data, error: null }) // Allow await directly
              };
            },
            order: () => ({ data: [], error: null }), // Mock empty list for other queries
            insert: async (data) => {
                console.log(`Mock Insert into ${table}:`, data);
                return { data, error: null };
            },
            update: async (data) => {
                 console.log(`Mock Update ${table}:`, data);
                 return { data, error: null };
            },
             delete: async () => {
                 console.log(`Mock Delete from ${table}`);
                 return { data: null, error: null };
            }
          };
        },
        insert: async (data) => {
            console.log(`Mock Insert into ${table}:`, data);
            return { data, error: null };
        }
      };
    },
    functions: {
      invoke: async (functionName, options) => {
        console.log(`Mock Function Invoke: ${functionName}`, options);
        if (functionName === 'send-sms') {
           return { data: { ok: true }, error: null };
        }
        return { data: {}, error: null };
      }
    },
    storage: {
        from: (bucket) => ({
            upload: async (path, file) => {
                console.log(`Mock Upload to ${bucket}/${path}`);
                return { data: { path }, error: null };
            },
            getPublicUrl: (path) => {
                return { data: { publicUrl: `https://mock-storage/${bucket}/${path}` } };
            },
            remove: async (paths) => {
                 console.log(`Mock Remove from ${bucket}:`, paths);
                 return { data: {}, error: null };
            }
        })
    }
  };
};

export const mockSupabase = createMockClient();
