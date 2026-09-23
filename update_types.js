const fs = require('fs');
const file = './src/types/database.ts';
let content = fs.readFileSync(file, 'utf8');

const tableDef = `      auto_messages: {
        Row: {
          id: string
          workspace_id: string
          contact_id: string
          message_type: string
          content: string
          metadata: Json
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          contact_id: string
          message_type: string
          content: string
          metadata?: Json
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          contact_id?: string
          message_type?: string
          content?: string
          metadata?: Json
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auto_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "auto_workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
`;

content = content.replace('      auto_social_accounts: {', tableDef + '      auto_social_accounts: {');
fs.writeFileSync(file, content);
