"use client";

import { useEffect, useState, useRef } from "react";
import { 
  MessageSquare, User, Phone, Send, Search, 
  MoreVertical, Check, Clock, Bot
} from "lucide-react";
import { format } from "date-fns";

type Contact = {
  id: string;
  name: string;
  whatsapp_phone: string;
  instagram_username: string;
  stage: string;
  tags: string[];
  last_contacted_at: string;
};

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  platform: "whatsapp" | "instagram";
  text: string | null;
  created_at: string;
  metadata: any;
};

export default function CRMDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
      const interval = setInterval(() => fetchMessages(activeContact.id, true), 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [activeContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/crm/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (contactId: string, background = false) => {
    if (!background) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/crm/messages?contactId=${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!background) setLoadingMessages(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeContact) return;

    const textToSend = draft.trim();
    setDraft("");
    setSending(true);

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      direction: "outbound",
      platform: "whatsapp",
      text: textToSend,
      created_at: new Date().toISOString(),
      metadata: {}
    }]);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: activeContact.id, text: textToSend })
      });

      if (!res.ok) {
        throw new Error("Failed to send");
      }
      
      // Refresh to get real message ID from DB
      await fetchMessages(activeContact.id, true);
    } catch (err) {
      console.error("Send error:", err);
      // Remove optimistic message on fail
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-zinc-50/50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl backdrop-blur-sm">
      
      {/* Sidebar - Contacts List */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white/50 dark:bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Live Inbox
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingContacts ? (
            <div className="p-4 text-center text-zinc-500 text-sm">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
              <Bot className="w-8 h-8 opacity-50" />
              <p>No conversations yet. Connect your WhatsApp and send a message to get started.</p>
            </div>
          ) : (
            contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                  activeContact?.id === contact.id 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500/30" 
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-sm shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-medium text-sm truncate pr-2">
                      {contact.name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {format(new Date(contact.last_contacted_at), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 
                    {contact.whatsapp_phone}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950/30 relative">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md absolute top-0 w-full z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-md">
                  {activeContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold">{activeContact.name}</h2>
                  <div className="text-xs flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Active on WhatsApp
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-24 pb-6 space-y-6">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-zinc-500">
                  <Clock className="w-5 h-5 animate-spin mr-2" /> Loading history...
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOutbound = msg.direction === "outbound";
                  const showAvatar = !isOutbound && (idx === 0 || messages[idx - 1].direction !== "inbound");

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isOutbound ? "items-end" : "items-start"} w-full`}
                    >
                      <div className={`flex max-w-[75%] gap-2 ${isOutbound ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Avatar spacer for inbound */}
                        {!isOutbound && (
                          <div className="w-8 shrink-0 flex justify-end">
                            {showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs shadow-sm mt-auto">
                                {activeContact.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}>
                          <div 
                            className={`px-4 py-2.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                              isOutbound 
                                ? "bg-indigo-600 text-white rounded-br-sm" 
                                : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-bl-sm"
                            }`}
                          >
                            {msg.text || (
                              <span className="italic opacity-50">
                                {msg.metadata?.isInteractive ? "[Interactive Button Reply]" : "[Media Message]"}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {isOutbound && (
                              <Check className="w-3 h-3 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Input */}
            <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800">
              <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-4xl mx-auto">
                <textarea 
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder={`Reply to ${activeContact.name.split(' ')[0]}...`}
                  className="w-full bg-zinc-100 dark:bg-zinc-800/80 border-none rounded-2xl pl-4 pr-12 py-3.5 text-[15px] focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none max-h-32 min-h-[52px]"
                  rows={1}
                />
                <button 
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="absolute right-2 bottom-2 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-sm shadow-indigo-500/30"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <div className="text-center mt-2">
                <p className="text-[10px] text-zinc-400 font-medium">
                  Press <kbd className="font-sans px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Enter</kbd> to send, <kbd className="font-sans px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Shift + Enter</kbd> for new line
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-500/20">
              <MessageSquare className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Your Unified Inbox</h3>
            <p className="text-sm mt-1">Select a contact to view their conversation history</p>
          </div>
        )}
      </div>
    </div>
  );
}
