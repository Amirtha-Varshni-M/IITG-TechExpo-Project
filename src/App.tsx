import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Map,
  Flame,
  ShieldCheck,
  Zap,
  Briefcase,
  Coins,
  Settings,
  LogIn,
  LogOut,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Upload,
  Globe,
  TrendingUp,
  FileCheck,
  FileQuestion,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert,
  Compass
} from 'lucide-react';

import OSINTProductivitySuite from './components/OSINTProductivitySuite';

// Define TS Interfaces
interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization: string;
  verification_points: number;
}

interface Incident {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  damage_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence_score: number;
  verification_status: 'pending' | 'under_review' | 'verified';
  description: string;
  reporter: string;
  created_at: string;
  verification_chain: Array<{
    source: string;
    verified: boolean;
    date: string | null;
    notes: string;
  }>;
}

interface EvidenceSource {
  id: string;
  incident_id: string;
  source_type: 'satellite' | 'osint' | 'citizen' | 'legal';
  name: string;
  data: Record<string, any>;
  verified: boolean;
}

interface Claim {
  id: string;
  incident_id: string;
  claimant_name: string;
  damage_severity: string;
  claim_data: {
    property_value_estimate: number;
    compensation_tier: string;
    notes?: string;
    auto_notes?: string;
  };
  status: 'submitted' | 'reviewing' | 'approved' | 'paid';
  created_at: string;
}

interface RiskPrediction {
  id: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: Record<string, string>;
  recommended_actions: string[];
}

interface ActiveAlert {
  id: string;
  title: string;
  location: string;
  type: string;
  time: string;
  severity: string;
  status: string;
}

interface Dossier {
  incident_id: string;
  title: string;
  content: string;
  cryptographic_proof: string;
  created_at: string;
}

export default function App() {
  // Routing & Authentication State
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [user, setUser] = useState<UserSession | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState('Volunteer');
  const [regOrg, setRegOrg] = useState('');

  // Domain States
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(null);
  const [sources, setSources] = useState<EvidenceSource[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [riskMap, setRiskMap] = useState<RiskPrediction[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [dossiers, setDossiers] = useState<Record<string, Dossier>>({});
  const [dossierViews, setDossierViews] = useState<Record<string, 'standard' | 'hague'>>({});
  const [sealedDossiers, setSealedDossiers] = useState<Record<string, { sealed: boolean; sealerName: string; sealerOrg: string; date: string }>>({});
  const [witnessAffidavits, setWitnessAffidavits] = useState<Record<string, { text: string; signedBy: string; signatureHash: string }>>({});
  const [tempAffidavitText, setTempAffidavitText] = useState<Record<string, string>>({});
  const [isSealing, setIsSealing] = useState<Record<string, boolean>>({});

  // Operational states
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  // New Incident Form State
  const [newTitle, setNewTitle] = useState('');
  const [newLat, setNewLat] = useState('48.3794');
  const [newLon, setNewLon] = useState('31.1656');
  const [newType, setNewType] = useState('Residential Building');
  const [newSeverity, setNewSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [newDesc, setNewDesc] = useState('');

  // New Claim Form State
  const [claimIncidentId, setClaimIncidentId] = useState('');
  const [claimantName, setClaimantName] = useState('');
  const [claimEstimate, setClaimEstimate] = useState('');
  const [claimTier, setClaimTier] = useState('Tier 2 - Major Structural Integrity Recovery');
  const [claimNotes, setClaimNotes] = useState('');

  // AI Investigative & Legal Assistant Agent States
  const [agentMessages, setAgentMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Greetings investigator. I am Aletheia's dedicated AI Investigative Agent & Legal Assistant. Select one of my specialized analysis configurations below, optionally link a coordinate incident to ground my scope, and let's begin analyzing conflict-zone damage evidence." }
  ]);
  const [selectedAgentRole, setSelectedAgentRole] = useState<'ihl-prosecutor' | 'osint-expert' | 'claims-officer' | 'affidavit-notary'>('ihl-prosecutor');
  const [agentContextIncidentId, setAgentContextIncidentId] = useState<string>('');
  const [agentInputText, setAgentInputText] = useState<string>('');
  const [isAgentTyping, setIsAgentTyping] = useState<boolean>(false);

  // Leaflet map instances
  const mapRef = useRef<any>(null);

  // API Base Endpoint helper
  const API_BASE = '/api';

  // Toast trigger
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Check Auth on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem('aletheia_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchData();
  }, []);

  // Fetch Core System Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInc, resAlert, resRisk, resClaims, resDossiers] = await Promise.all([
        fetch(`${API_BASE}/incidents`),
        fetch(`${API_BASE}/early-warning/alerts`),
        fetch(`${API_BASE}/early-warning/risk-map`),
        fetch(`${API_BASE}/claims`),
        fetch(`${API_BASE}/legal/dossiers`),
      ]);

      if (resInc.ok) setIncidents(await resInc.json());
      if (resAlert.ok) setAlerts(await resAlert.json());
      if (resRisk.ok) setRiskMap(await resRisk.json());
      if (resClaims.ok) setClaims(await resClaims.json());
      if (resDossiers.ok) setDossiers(await resDossiers.json());
    } catch (err) {
      console.error('Error loading data from ALETHEIA backend:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Single Incident Details (and its sources)
  useEffect(() => {
    if (currentIncidentId) {
      const inc = incidents.find(i => i.id === currentIncidentId);
      if (inc) setSelectedIncident(inc);

      // Fetch sources for this incident
      fetch(`${API_BASE}/sources/incident/${currentIncidentId}`)
        .then(res => res.json())
        .then(data => setSources(data))
        .catch(err => console.error('Error fetching evidence sources:', err));
    } else {
      setSelectedIncident(null);
      setSources([]);
    }
  }, [currentIncidentId, incidents]);

  // Bind Global view handler for Leaflet Marker HTML click redirects
  useEffect(() => {
    (window as any).viewIncidentDetail = (id: string) => {
      setCurrentIncidentId(id);
      setCurrentPage('incident-detail');
    };
  }, []);

  // Initialize or update Fullscreen Damage Map
  useEffect(() => {
    if (currentPage === 'damage-map' && incidents.length > 0) {
      setTimeout(() => {
        // Clear old container ID trace to prevent re-init error
        const mapContainer = (window as any).L.DomUtil.get('full-leaflet-map');
        if (mapContainer != null) {
          mapContainer._leaflet_id = null;
        }

        const map = (window as any).L.map('full-leaflet-map', {
          zoomControl: true,
          scrollWheelZoom: true
        }).setView([48.3794, 31.1656], 6);

        // Apply dark themed tiles
        (window as any).L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        incidents.forEach(inc => {
          let markerColor = '#F39C12'; // Default warning/medium
          if (inc.severity === 'critical') markerColor = '#E74C3C'; // Red
          if (inc.severity === 'high') markerColor = '#E74C3C';
          if (inc.severity === 'low') markerColor = '#27AE60'; // Green

          const customIcon = (window as any).L.divIcon({
            html: `<div style="background-color: ${markerColor};" class="w-4 h-4 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
            className: 'custom-leaflet-icon',
            iconSize: [16, 16]
          });

          const marker = (window as any).L.marker([inc.latitude, inc.longitude], { icon: customIcon }).addTo(map);
          marker.bindPopup(`
            <div class="text-slate-900 p-2 font-sans w-56">
              <span class="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">${inc.damage_type}</span>
              <h3 class="font-bold text-sm text-[#0A1628] mt-1">${inc.title}</h3>
              <p class="text-xs text-slate-600 mt-1 line-clamp-2">${inc.description}</p>
              <div class="mt-2 flex items-center justify-between">
                <span class="text-xs font-semibold capitalize text-red-600">${inc.severity} Severity</span>
                <span class="text-xs font-bold text-indigo-700 font-numeric">${inc.confidence_score}% Verified</span>
              </div>
              <button onclick="window.viewIncidentDetail('${inc.id}')" class="mt-3 w-full text-center bg-[#0A1628] text-white text-xs font-bold py-1.5 px-3 rounded hover:bg-[#D4AF37] hover:text-[#0A1628] transition-all">
                Analyze Evidence Chain
              </button>
            </div>
          `);
        });

        mapRef.current = map;
      }, 100);
    }
  }, [currentPage, incidents]);

  // Handle Authentication Action
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('aletheia_user', JSON.stringify(data.user));
          setUser(data.user);
          showToast(`Logged in successfully as ${data.user.full_name}!`);
          setCurrentPage('dashboard');
        } else {
          showToast(data.error || 'Invalid credentials', 'error');
        }
      } catch (err) {
        showToast('Connection to backend failed', 'error');
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: regEmail,
            password: regPassword,
            full_name: regFullName,
            role: regRole,
            organization: regOrg
          })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('aletheia_user', JSON.stringify(data.user));
          setUser(data.user);
          showToast(`Account registered successfully as ${data.user.full_name}!`);
          setCurrentPage('dashboard');
        } else {
          showToast(data.error || 'Registration failed', 'error');
        }
      } catch (err) {
        showToast('Connection to backend failed', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aletheia_user');
    setUser(null);
    showToast('Logged out successfully', 'info');
    setCurrentPage('dashboard');
  };

  // Submit new incident
  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLat || !newLon) {
      showToast('Please fill out all required incident details.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          latitude: newLat,
          longitude: newLon,
          damage_type: newType,
          severity: newSeverity,
          description: newDesc,
          reporter: user ? user.full_name : 'Anonymous Reporter'
        })
      });

      if (res.ok) {
        showToast('Incident reported successfully to blockchain & satellite queues!');
        setIsNewIncidentOpen(false);
        // Clear fields
        setNewTitle('');
        setNewDesc('');
        // Refresh
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to submit incident', 'error');
      }
    } catch (err) {
      showToast('Network error submitting incident', 'error');
    }
  };

  // Execute AI Cross-Verification
  const triggerVerification = async (incidentId: string) => {
    setIsVerifying(incidentId);
    try {
      const res = await fetch(`${API_BASE}/verification/incident/${incidentId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`AI Cross-Verification Done! Score: ${data.confidence_score}%. Status: ${data.status.toUpperCase()}`);
        // Update local state lists
        setIncidents(prev => prev.map(inc => inc.id === incidentId ? { 
          ...inc, 
          confidence_score: data.confidence_score, 
          verification_status: data.status,
          verification_chain: data.verification_chain
        } : inc));
        fetchData();
      } else {
        showToast(data.error || 'Verification failed', 'error');
      }
    } catch (err) {
      showToast('Network error during cross-verification', 'error');
    } finally {
      setIsVerifying(null);
    }
  };

  // Execute Legal Dossier Generation (Gemini AI powered)
  const generateLegalDossier = async (incidentId: string) => {
    setIsGeneratingDossier(incidentId);
    try {
      const res = await fetch(`${API_BASE}/legal/generate-dossier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Legal Evidence Dossier Compiled successfully! Proof: ${data.dossier.cryptographic_proof.slice(0, 10)}...`);
        // Refresh dossiers list
        const resDos = await fetch(`${API_BASE}/legal/dossiers`);
        if (resDos.ok) setDossiers(await resDos.json());
        setCurrentPage('legal-hub');
      } else {
        showToast(data.error || 'Dossier generation failed', 'error');
      }
    } catch (err) {
      showToast('Network error during dossier compilation', 'error');
    } finally {
      setIsGeneratingDossier(null);
    }
  };

  // Trigger claim Auto-Fill from incident details
  const autoFillClaim = async (incidentId: string) => {
    if (!incidentId) return;
    setIsAutoFilling(true);
    try {
      const res = await fetch(`${API_BASE}/claims/auto-fill/${incidentId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setClaimIncidentId(data.incident_id);
        setClaimantName(data.claimant_name);
        setClaimEstimate(data.property_value_estimate.toString());
        setClaimTier(data.compensation_tier);
        setClaimNotes(data.auto_notes);
        showToast('Claim pre-populated with verified satellite & OSINT data.');
      } else {
        showToast(data.error || 'Auto-fill failed', 'error');
      }
    } catch (err) {
      showToast('Error auto-filling claim', 'error');
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Submit Claim
  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimIncidentId || !claimantName || !claimEstimate) {
      showToast('Please fill out all required claim details.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: claimIncidentId,
          claimant_name: claimantName,
          property_value_estimate: claimEstimate,
          compensation_tier: claimTier,
          notes: claimNotes
        })
      });

      if (res.ok) {
        showToast('Reparation compensation claim registered successfully!');
        setClaimIncidentId('');
        setClaimantName('');
        setClaimEstimate('');
        setClaimNotes('');
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to file claim', 'error');
      }
    } catch (err) {
      showToast('Network error filing claim', 'error');
    }
  };

  // Submit AI Agent chat message
  const sendAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInputText.trim()) return;

    const userMsgText = agentInputText.trim();
    const updatedMessages = [...agentMessages, { role: 'user' as const, content: userMsgText }];
    setAgentMessages(updatedMessages);
    setAgentInputText('');
    setIsAgentTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chat/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          agentRole: selectedAgentRole,
          incidentId: agentContextIncidentId || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAgentMessages([...updatedMessages, { role: 'assistant' as const, content: data.message }]);
      } else {
        showToast(data.error || 'AI Agent failed to respond', 'error');
        setAgentMessages([...updatedMessages, { role: 'assistant' as const, content: "⚠️ System error: The AI Agent could not communicate with the core reasoning unit. Please verify your Gemini API Key in System Settings or try again." }]);
      }
    } catch (err) {
      showToast('Network error contacting AI Agent', 'error');
      setAgentMessages([...updatedMessages, { role: 'assistant' as const, content: "⚠️ Network error: Connection timed out. Please check your internet connectivity and ensure the backend container is fully initialized." }]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  // Filter & Search logic for Incident Log
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || inc.verification_status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Simple view switcher
  const navigateTo = (page: string, incidentId?: string) => {
    if (incidentId) {
      setCurrentIncidentId(incidentId);
    }
    setCurrentPage(page);
  };

  // Helper styles for badges
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-900/30 text-red-400 border border-red-500/30';
      case 'high': return 'bg-orange-900/30 text-orange-400 border border-orange-500/30';
      case 'medium': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-green-900/30 text-green-400 border border-green-500/30';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30';
      case 'under_review': return 'bg-sky-900/30 text-sky-400 border border-sky-500/30';
      default: return 'bg-zinc-800/80 text-zinc-400 border border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white flex flex-col md:flex-row relative font-sans">
      
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md transition-all duration-300 max-w-sm ${
          toastMsg.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50' : 
          toastMsg.type === 'error' ? 'bg-red-950/90 text-red-200 border-red-500/50' : 
          'bg-slate-900/90 text-slate-200 border-slate-700/50'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : 
           toastMsg.type === 'error' ? <XCircle className="w-5 h-5 text-red-400 shrink-0" /> : 
           <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />}
          <p className="text-xs font-semibold">{toastMsg.text}</p>
        </div>
      )}

      {/* ==========================================
          SIDEBAR NAVIGATION
          ========================================== */}
      <aside className="w-full md:w-64 bg-[#1A2A4A] border-b md:border-b-0 md:border-r border-slate-800 shrink-0 flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gold rounded-full animate-ping"></span>
              <h1 className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
                ALETHEIA
              </h1>
            </div>
            <p className="text-[9px] text-[#D4AF37] tracking-widest font-semibold uppercase mt-0.5">
              Unified Damage Verification
            </p>
          </div>
        </div>

        {/* User context widget */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0F1E36]">
          {user ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0A1628] font-bold flex items-center justify-center text-xs uppercase shadow">
                  {user.full_name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold truncate max-w-[140px]">{user.full_name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{user.role}</p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                <span className="text-slate-400 truncate max-w-[110px]">{user.organization}</span>
                <span className="text-gold font-bold font-numeric shrink-0">★ {user.verification_points} XP</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-slate-400 leading-relaxed">Connect observer profile to submit and verify evidence.</p>
              <button 
                onClick={() => navigateTo('login-page')}
                className="w-full py-1.5 bg-[#D4AF37] text-[#0A1628] font-bold rounded text-xs flex items-center justify-center gap-1.5 hover:bg-[#FFD700] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'dashboard' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
          </button>

          <button
            onClick={() => navigateTo('damage-map')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'damage-map' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Map className="w-4 h-4 shrink-0" /> Damage Map
          </button>

          <button
            onClick={() => navigateTo('incidents-log')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'incidents-log' || currentPage === 'incident-detail' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" /> Incidents Log
          </button>

          <button
            onClick={() => navigateTo('verification-engine')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'verification-engine' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" /> AI Cross-Verifier
          </button>

          <button
            onClick={() => navigateTo('early-warning')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'early-warning' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" /> Early Warning AI
          </button>

          <button
            onClick={() => navigateTo('legal-hub')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'legal-hub' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" /> Legal Evidence Hub
          </button>

          <button
            onClick={() => navigateTo('ai-assistant')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'ai-assistant' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" /> AI Investigative Agent
          </button>

          <button
            onClick={() => navigateTo('osint-toolbox')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'osint-toolbox' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0 text-amber-400" /> OSINT & Legal Toolbox
          </button>

          <button
            onClick={() => navigateTo('claims-portal')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'claims-portal' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" /> Compensation Claims
          </button>

          <button
            onClick={() => navigateTo('settings-page')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'settings-page' ? 'bg-[#0A1628] text-[#D4AF37] border-l-2 border-gold shadow-md' : 'text-slate-300 hover:bg-[#0F1E36] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" /> System Settings
          </button>
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0F1E36] flex flex-col gap-2">
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-900/30 transition-colors text-xs font-bold rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
          <div className="text-[9px] text-slate-500 text-center font-semibold">
            ALETHEIA CORE • HACKATHON EDITION
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN PAGE BODY WINDOW
          ========================================== */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#0A1628] overflow-y-auto">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
            <h2 className="text-lg font-bold text-white tracking-widest uppercase">Initializing Aletheia Engine...</h2>
            <p className="text-xs text-slate-400 mt-2">Loading live satellite records and OSINT streams</p>
          </div>
        ) : (
          <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">

            {/* ==========================================
                1. LOGIN / REGISTER PAGE
                ========================================== */}
            {currentPage === 'login-page' && (
              <div className="max-w-md mx-auto my-12 bg-[#1A2A4A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="text-center mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Observer Registry</span>
                  <h2 className="text-2xl font-bold mt-1 text-white">Access Verification Core</h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Log in with a secure observer profile to upload damage evidence, execute cross-verifications, and generate judicial evidence dossiers.
                  </p>
                </div>

                <div className="flex bg-[#0A1628] p-1 rounded-xl mb-6">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      authMode === 'login' ? 'bg-[#1A2A4A] text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Observer Sign In
                  </button>
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      authMode === 'register' ? 'bg-[#1A2A4A] text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register Account
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="Dr. Elena Rostova"
                          className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Role Type</label>
                          <select
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value)}
                            className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                          >
                            <option value="Volunteer">Local Volunteer</option>
                            <option value="Humanitarian">Humanitarian</option>
                            <option value="Legal">Legal Expert</option>
                            <option value="Citizen">Local Resident</option>
                            <option value="Admin">System Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Organization</label>
                          <input
                            type="text"
                            value={regOrg}
                            onChange={(e) => setRegOrg(e.target.value)}
                            placeholder="Red Cross Local"
                            className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authMode === 'login' ? loginEmail : regEmail}
                      onChange={(e) => authMode === 'login' ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)}
                      placeholder="observer@aletheia.org"
                      className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Access Password</label>
                    <input
                      type="password"
                      required
                      value={authMode === 'login' ? loginPassword : regPassword}
                      onChange={(e) => authMode === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 mt-6 bg-[#D4AF37] text-[#0A1628] font-bold rounded-xl text-xs hover:bg-[#FFD700] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {authMode === 'login' ? 'Authenticate Profile' : 'Create Observer Profile'}
                  </button>

                  <div className="pt-4 border-t border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        // Reset simple credentials for quick testing
                        setLoginEmail('admin@aletheia.org');
                        setLoginPassword('admin123');
                        setAuthMode('login');
                        showToast('Quick demo credentials auto-filled.', 'info');
                      }}
                      className="text-[10px] text-gold font-bold hover:underline"
                    >
                      Use Demo credentials (admin@aletheia.org)
                    </button>
                  </div>
                </form>
              </div>
            )}


            {/* ==========================================
                2. DASHBOARD PAGE
                ========================================== */}
            {currentPage === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Aletheia Operational Command</span>
                    <h2 className="text-xl font-bold mt-1 text-white">Unified Conflict Damage Core</h2>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                      Tracking, cross-verifying, and building legal claims for civilian infrastructure destruction. Satellite orbital analysis synchronizing in real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsNewIncidentOpen(true)}
                      className="bg-gold hover:bg-gold-light text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <Plus className="w-4 h-4 shrink-0" /> Submit Raw Evidence
                    </button>
                    <button
                      onClick={() => { fetchData(); showToast('Re-synchronizing all sensor queues...', 'info'); }}
                      className="bg-[#0A1628] text-white border border-slate-800 hover:border-[#D4AF37] font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-slow shrink-0" /> Refresh
                    </button>
                  </div>
                </div>

                {/* 4 KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-red-950/40 text-red-400 border border-red-900/20">
                      <Flame className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Strikes</span>
                      <h3 className="text-2xl font-black font-numeric mt-1 tracking-tight text-white">{incidents.length}</h3>
                      <p className="text-[10px] text-red-400 mt-0.5 font-semibold">Conflict Zone Active</p>
                    </div>
                  </div>

                  <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-900/20">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Verified</span>
                      <h3 className="text-2xl font-black font-numeric mt-1 tracking-tight text-white">
                        {incidents.filter(i => i.verification_status === 'verified').length}
                      </h3>
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                        {Math.floor((incidents.filter(i => i.verification_status === 'verified').length / (incidents.length || 1)) * 100)}% Match Success
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-yellow-950/40 text-yellow-400 border border-yellow-900/20">
                      <User className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Observers Active</span>
                      <h3 className="text-2xl font-black font-numeric mt-1 tracking-tight text-white">5</h3>
                      <p className="text-[10px] text-yellow-400 mt-0.5 font-semibold">Cryptographic Profiles</p>
                    </div>
                  </div>

                  <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-sky-950/40 text-sky-400 border border-sky-900/20">
                      <Clock className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg Response Speed</span>
                      <h3 className="text-2xl font-black font-numeric mt-1 tracking-tight text-white">4.2h</h3>
                      <p className="text-[10px] text-sky-400 mt-0.5 font-semibold">Orbits Cross-Validated</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard grid core */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left block - mini map and alert logs */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold tracking-wider text-white flex items-center gap-2 uppercase">
                          <Globe className="w-4 h-4 text-gold shrink-0 animate-spin-slow" /> Active Sector Damage Coordinates
                        </h3>
                        <button onClick={() => navigateTo('damage-map')} className="text-xs text-gold font-bold hover:underline">
                          Open Interactive Map →
                        </button>
                      </div>
                      <div className="h-64 rounded-xl bg-[#0A1628] border border-slate-800 relative flex items-center justify-center p-4 overflow-hidden">
                        {/* Beautiful representation grid layout as a map inside the dashboard to preserve load time and UI safety */}
                        <div className="absolute inset-0 bg-slate-950 opacity-45 grid grid-cols-6 grid-rows-4">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="border-t border-l border-slate-900/60"></div>
                          ))}
                        </div>
                        <div className="relative text-center max-w-sm space-y-4">
                          <div className="relative inline-block">
                            <span className="absolute -inset-2 rounded-full bg-red-500/25 animate-ping"></span>
                            <div className="bg-red-900/40 border border-red-500/50 px-4 py-2 rounded-xl text-red-200 text-[10px] font-bold font-numeric">
                              5 Active Damage Anomalies Tracked
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Click coordinates below to run the cross-verification algorithms on raw optical images.
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {incidents.slice(0, 3).map(inc => (
                              <button
                                key={inc.id}
                                onClick={() => navigateTo('incident-detail', inc.id)}
                                className="bg-[#1A2A4A]/80 border border-slate-800 hover:border-[#D4AF37] px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${inc.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                                {inc.id.toUpperCase()}: {inc.title.slice(0, 16)}...
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Incident Feed */}
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
                      <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                        Recent Incidents Feed
                      </h3>
                      <div className="divide-y divide-slate-800">
                        {incidents.slice(0, 3).map(inc => (
                          <div key={inc.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold font-numeric">{inc.id.toUpperCase()}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${getSeverityStyle(inc.severity)}`}>
                                  {inc.severity}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${getStatusStyle(inc.verification_status)}`}>
                                  {inc.verification_status.replace('_', ' ')}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white hover:text-gold transition-colors cursor-pointer" onClick={() => navigateTo('incident-detail', inc.id)}>
                                {inc.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">{inc.description}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-indigo-400 font-numeric block">{inc.confidence_score}% Confidence</span>
                                <span className="text-[9px] text-slate-500 font-numeric">{new Date(inc.created_at).toLocaleDateString()}</span>
                              </div>
                              <button
                                onClick={() => navigateTo('incident-detail', inc.id)}
                                className="bg-[#0A1628] hover:bg-[#D4AF37] hover:text-[#0A1628] border border-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right block - risk and alerts summary */}
                  <div className="space-y-6">
                    
                    {/* Early warning widget */}
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold tracking-wider text-white flex items-center gap-2 uppercase">
                          <Zap className="w-4 h-4 text-[#D4AF37] shrink-0" /> Active Alerts Forecast
                        </h3>
                        <button onClick={() => navigateTo('early-warning')} className="text-xs text-gold font-bold hover:underline">
                          View Dashboard
                        </button>
                      </div>
                      <div className="space-y-3">
                        {alerts.map(alt => (
                          <div key={alt.id} className="p-3.5 rounded-xl bg-[#0A1628] border border-slate-800/80 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-500 font-bold font-numeric">{alt.id.toUpperCase()}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                alt.severity === 'critical' ? 'bg-red-950/50 text-red-400' : 'bg-yellow-950/50 text-yellow-400'
                              }`}>
                                {alt.severity}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{alt.title}</h4>
                            <p className="text-[9px] text-slate-400 block truncate">{alt.location}</p>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[9px]">
                              <span className="text-[#D4AF37] font-semibold">{alt.type}</span>
                              <span className="text-slate-500 font-numeric">{alt.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verification system status quick widget */}
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
                      <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                        Unified DB Sync Status
                      </h3>
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Copernicus Sentinel Satellites</span>
                          <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">● ONLINE</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Citizen Observation Feed</span>
                          <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">● ACTIVE</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">International Land Registry (Deeds)</span>
                          <span className="text-yellow-400 font-bold text-[10px] flex items-center gap-1">● QUEUED</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">ALETHEIA Legal Proof Ledger</span>
                          <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">● SECURED</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}


            {/* ==========================================
                3. DAMAGE MAP PAGE (FULLSCREEN)
                ========================================== */}
            {currentPage === 'damage-map' && (
              <div className="space-y-4">
                <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold">Interactive Damage Sensor Map</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Displaying active verified incidents matching Copernicus satellites, news geolocations, and ground observers.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Map Scale: 1:1,000,000</span>
                    <button
                      onClick={() => {
                        if (mapRef.current) {
                          mapRef.current.setView([48.3794, 31.1656], 5);
                        }
                      }}
                      className="bg-[#0A1628] hover:bg-slate-800 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-800"
                    >
                      Reset Zoom
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left filter bar */}
                  <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
                    <h3 className="text-xs font-bold tracking-wider uppercase text-white pb-2 border-b border-slate-800">
                      Layer Filters
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Severity Levels</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <span className="w-3 h-3 rounded bg-red-600"></span> Critical Destruction
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <span className="w-3 h-3 rounded bg-orange-500"></span> High Damage
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <span className="w-3 h-3 rounded bg-yellow-500"></span> Medium/Minor
                          </label>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confidence Scale</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" defaultChecked className="rounded text-gold bg-slate-900 border-slate-800" /> High Confidence (&gt;80%)
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" defaultChecked className="rounded text-gold bg-slate-900 border-slate-800" /> Under Review
                          </label>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/50 rounded-xl space-y-2 border border-slate-800/80">
                        <h4 className="text-[10px] font-bold text-gold uppercase tracking-wider">Aletheia Geo-Radars</h4>
                        <p className="text-[9px] text-slate-400 leading-relaxed">
                          Satellite image overlaps are updated every 6 hours. Synthetic Aperture Radar (SAR) penetrates cloud cover automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Map canvas */}
                  <div className="lg:col-span-3 h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                    <div id="full-leaflet-map" className="w-full h-full z-10"></div>
                  </div>
                </div>
              </div>
            )}


            {/* ==========================================
                4. INCIDENTS LOG PAGE
                ========================================== */}
            {currentPage === 'incidents-log' && (
              <div className="space-y-6">
                
                {/* Filters Row */}
                <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search incident titles or descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#0A1628] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Filter className="w-3.5 h-3.5 text-gold" /> Filter by:
                    </div>

                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="bg-[#0A1628] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#0A1628] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="all">All Verification Statuses</option>
                      <option value="verified">Verified</option>
                      <option value="under_review">Under Review</option>
                      <option value="pending">Pending</option>
                    </select>

                    <button
                      onClick={() => setIsNewIncidentOpen(true)}
                      className="bg-gold text-slate-950 font-bold px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 shadow ml-auto hover:bg-[#FFD700] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Log
                    </button>
                  </div>
                </div>

                {/* Table list view */}
                <div className="bg-[#1A2A4A] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-[#0F1E36] border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          <th className="p-4 pl-6">ID & Coordinates</th>
                          <th className="p-4">Incident Information</th>
                          <th className="p-4">Severity</th>
                          <th className="p-4">Verification Score</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right pr-6">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-xs">
                        {filteredIncidents.length > 0 ? (
                          filteredIncidents.map(inc => (
                            <tr key={inc.id} className="hover:bg-[#0F1E36]/40 transition-colors">
                              <td className="p-4 pl-6">
                                <div className="space-y-1">
                                  <span className="font-bold font-numeric text-slate-300 block">{inc.id.toUpperCase()}</span>
                                  <span className="text-[10px] text-slate-500 block font-numeric">Lat: {inc.latitude.toFixed(4)}, Lon: {inc.longitude.toFixed(4)}</span>
                                </div>
                              </td>
                              <td className="p-4 max-w-sm">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-white hover:text-gold transition-colors cursor-pointer" onClick={() => navigateTo('incident-detail', inc.id)}>
                                    {inc.title}
                                  </h4>
                                  <span className="text-[10px] text-[#D4AF37] font-semibold">{inc.damage_type}</span>
                                  <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">{inc.description}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase ${getSeverityStyle(inc.severity)}`}>
                                  {inc.severity}
                                </span>
                              </td>
                              <td className="p-4 font-bold font-numeric text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <span>{inc.confidence_score}%</span>
                                  <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                                    <div style={{ width: `${inc.confidence_score}%` }} className="bg-[#D4AF37] h-full"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase ${getStatusStyle(inc.verification_status)}`}>
                                  {inc.verification_status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => navigateTo('incident-detail', inc.id)}
                                    className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-[#D4AF37] font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition-all"
                                  >
                                    View Log
                                  </button>
                                  {inc.verification_status !== 'verified' && (
                                    <button
                                      onClick={() => triggerVerification(inc.id)}
                                      disabled={isVerifying === inc.id}
                                      className="bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
                                    >
                                      {isVerifying === inc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                      Verify
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                              No active incidents found matching these filter settings.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}


            {/* ==========================================
                5. INCIDENT DETAIL PAGE
                ========================================== */}
            {currentPage === 'incident-detail' && selectedIncident && (
              <div className="space-y-6">
                
                {/* Back bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <button
                    onClick={() => navigateTo('incidents-log')}
                    className="text-xs text-gold font-bold hover:underline flex items-center gap-1.5"
                  >
                    ← Back to Incidents Log
                  </button>
                  <span className="text-[10px] text-slate-500 font-numeric uppercase font-bold">LEDGER TARGET ID: {selectedIncident.id.toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column - Core info, map, evidence */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${getSeverityStyle(selectedIncident.severity)}`}>
                          {selectedIncident.severity} Severity
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${getStatusStyle(selectedIncident.verification_status)}`}>
                          {selectedIncident.verification_status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 ml-auto font-numeric">Reported: {new Date(selectedIncident.created_at).toLocaleString()}</span>
                      </div>
                      
                      <h2 className="text-xl font-bold text-white">{selectedIncident.title}</h2>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedIncident.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Spatial Location</span>
                          <span className="text-white block mt-1 font-numeric">Lat: {selectedIncident.latitude.toFixed(6)}, Lon: {selectedIncident.longitude.toFixed(6)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Witness Reporter</span>
                          <span className="text-white block mt-1">{selectedIncident.reporter}</span>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Sources Gallery */}
                    <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                      <h3 className="text-xs font-bold tracking-wider uppercase text-white">
                        Evidence Sources & Metadata Trace
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sources.map(src => (
                          <div key={src.id} className="p-4 rounded-xl bg-[#0A1628] border border-slate-800 flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${
                              src.source_type === 'satellite' ? 'bg-sky-950 text-sky-400' :
                              src.source_type === 'osint' ? 'bg-purple-950 text-purple-400' :
                              src.source_type === 'citizen' ? 'bg-yellow-950 text-yellow-400' :
                              'bg-emerald-950 text-emerald-400'
                            }`}>
                              {src.source_type === 'satellite' ? <Globe className="w-4 h-4" /> :
                               src.source_type === 'osint' ? <Search className="w-4 h-4" /> :
                               src.source_type === 'citizen' ? <User className="w-4 h-4" /> :
                               <FileText className="w-4 h-4" />}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{src.name}</h4>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{src.source_type}</p>
                              
                              {/* Metadata list */}
                              <div className="text-[10px] text-slate-400 font-semibold space-y-0.5 pt-1 border-t border-slate-800/60 mt-1 font-numeric">
                                {Object.entries(src.data).map(([key, val]) => (
                                  <div key={key} className="truncate">
                                    <span className="text-slate-500">{key}:</span> {String(val)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column - Verification Chain & Active triggers */}
                  <div className="space-y-6">
                    
                    {/* Verification Chain Card */}
                    <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">ALETHEIA PROOF INTEGRITY</span>
                        <div className="text-3xl font-black font-numeric text-gold mt-1">{selectedIncident.confidence_score}%</div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Cross-Verification Confidence Index</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Multi-Channel Proof Status:</h4>
                        
                        <div className="space-y-3.5">
                          {selectedIncident.verification_chain.map(c => (
                            <div key={c.source} className="flex items-start gap-3 text-xs">
                              <div className="mt-0.5">
                                {c.verified ? (
                                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                                ) : (
                                  <FileQuestion className="w-4.5 h-4.5 text-slate-500" />
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">{c.source} Channel</span>
                                  {c.verified && <span className="text-[8px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Linked</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{c.notes}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 space-y-2.5">
                        <button
                          onClick={() => triggerVerification(selectedIncident.id)}
                          disabled={isVerifying === selectedIncident.id}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                        >
                          {isVerifying === selectedIncident.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Cross-Referencing Radars...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" /> Trigger Verification Engine
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => generateLegalDossier(selectedIncident.id)}
                          disabled={isGeneratingDossier === selectedIncident.id}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                        >
                          {isGeneratingDossier === selectedIncident.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Drafting Legal Brief...
                            </>
                          ) : (
                            <>
                              <FileCheck className="w-4 h-4" /> Compile Legal Evidence Dossier
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            autoFillClaim(selectedIncident.id);
                            setCurrentPage('claims-portal');
                          }}
                          className="w-full py-2.5 bg-[#0A1628] hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <Coins className="w-4 h-4" /> File Compensation Claim
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}


            {/* ==========================================
                6. VERIFICATION PAGE
                ========================================== */}
            {currentPage === 'verification-engine' && (
              <div className="space-y-6">
                <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <span className="text-[10px] text-gold uppercase tracking-widest font-bold">ALETHEIA PROOF STACK</span>
                  <h2 className="text-xl font-bold">Aletheia Cross-Verification Engine</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Our unique verification engine automatically correlates satellite scans, geotagged volunteer submissions, telegram news streams, and public registers within 500 meters to verify civilian structural damage with legal-grade confidence.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left block - engine run */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Select Incident Queue</h3>
                      
                      <div className="space-y-3">
                        {incidents.map(inc => (
                          <div key={inc.id} className="p-4 rounded-xl bg-[#0A1628] border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-numeric font-bold">{inc.id.toUpperCase()}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusStyle(inc.verification_status)}`}>
                                  {inc.verification_status.replace('_', ' ')}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold mt-1 text-white">{inc.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-md">{inc.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-indigo-400 font-numeric">{inc.confidence_score}% Checked</span>
                              <button
                                onClick={() => triggerVerification(inc.id)}
                                disabled={isVerifying === inc.id}
                                className="bg-gold hover:bg-[#FFD700] text-[#0A1628] font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
                              >
                                {isVerifying === inc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 shrink-0" />}
                                AI Verify
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right block - process visualization */}
                  <div className="space-y-6">
                    <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Proof Integrity Levels</h3>
                      
                      <div className="space-y-4 text-xs leading-relaxed">
                        <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 rounded-xl space-y-1.5">
                          <h4 className="font-bold text-emerald-400 uppercase text-[10px]">Verified (&gt;80% Score)</h4>
                          <p className="text-[10px] text-slate-400">At least 3 channels (Satellite SAR, direct media geotags, and municipal ownership deeds) successfully correlate within 500m spatial grid.</p>
                        </div>

                        <div className="p-3 bg-sky-950/40 border border-sky-900/40 rounded-xl space-y-1.5">
                          <h4 className="font-bold text-sky-400 uppercase text-[10px]">Under Review (50% - 80% Score)</h4>
                          <p className="text-[10px] text-slate-400">Two separate sources confirm impact but land ownership or high-res orbital satellite optical pass is blocked (usually by cloud cover).</p>
                        </div>

                        <div className="p-3 bg-zinc-850 border border-zinc-800 rounded-xl space-y-1.5">
                          <h4 className="font-bold text-slate-400 uppercase text-[10px]">Pending (&lt;50% Score)</h4>
                          <p className="text-[10px] text-slate-400">Direct observer report filed but orbital satellite queue and OSINT automation still running.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}


            {/* ==========================================
                7. EARLY WARNING PAGE
                ========================================== */}
            {currentPage === 'early-warning' && (
              <div className="space-y-6">
                
                {/* Intro */}
                <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Predictive Conflict Escalation Model</span>
                  <h2 className="text-xl font-bold">Predictive ML Early Warning Forecast</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Analyzing satellite troop deployment, frontline movement speeds, and local OSINT density trends using our custom LSTM + CNN ensemble models to predict conflict escalation risks within 24 to 72 hours.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Risks Feed */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 block pl-1">24h / 48h / 72h Grid Escalation Forecasts</h3>
                    
                    <div className="space-y-3">
                      {riskMap.map(risk => (
                        <div key={risk.id} className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
                          <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-bold font-numeric uppercase">{risk.id.toUpperCase()}: COORDS {risk.latitude.toFixed(4)}, {risk.longitude.toFixed(4)}</span>
                              <h4 className="text-xs font-bold text-white">Escalation Threat Level</h4>
                            </div>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-xl uppercase font-numeric ${
                              risk.risk_level === 'critical' ? 'bg-red-900/30 text-red-400 border border-red-500/40' :
                              risk.risk_level === 'high' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/40' :
                              'bg-yellow-950/30 text-yellow-400 border border-yellow-500/40'
                            }`}>
                              {risk.risk_level} • Score {risk.risk_score}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-[10px]">
                            {Object.entries(risk.factors).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-slate-500 capitalize block font-semibold">{k.replace(/_/g, ' ')}</span>
                                <span className="text-white block mt-0.5 font-numeric font-bold">{v}</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 bg-slate-950/60 rounded-xl space-y-1.5 border border-slate-800">
                            <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider block">Recommended Humanitarian Mitigation Actions:</span>
                            <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-300">
                              {risk.recommended_actions.map((act, i) => (
                                <li key={i}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Alert triggers */}
                  <div className="space-y-6">
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Active Operational Alerts</h3>
                      <div className="space-y-3.5">
                        {alerts.map(alt => (
                          <div key={alt.id} className="p-4 rounded-xl bg-[#0A1628] border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-[#D4AF37] uppercase">{alt.type}</span>
                              <span className="text-slate-500 font-numeric">{alt.time}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white leading-snug">{alt.title}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{alt.location}</p>
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold">Status:</span>
                              <span className="text-indigo-400 capitalize font-bold font-numeric">{alt.status.replace(/_/g, ' ')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}


            {/* ==========================================
                8. LEGAL EVIDENCE HUB PAGE
                ========================================== */}
            {currentPage === 'legal-hub' && (
              <div className="space-y-6">
                
                <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Judicial Redress Dossier Platform</span>
                  <h2 className="text-xl font-bold">Aletheia Legal Evidence Hub</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Generate court-ready damage dossiers packed with satellite SAR logs, OSINT geolocations, blockchain cryptographic seals, and proof of evidence custody to support war crimes records and compensation tribunals.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left list of dossiers */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 block pl-1">Generated Evidence Dossiers</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(dossiers as Record<string, any>).map(([id, dos]) => {
                        const relatedIncident = incidents.find(inc => inc.id === dos.incident_id);
                        const viewMode = dossierViews[id] || 'standard';
                        const isSealedObj = sealedDossiers[id];
                        const witnessAff = witnessAffidavits[id];
                        const currentSealing = isSealing[id];
                        const draftText = tempAffidavitText[id] || '';

                        let ihlCitationTitle = 'Rome Statute Article 8(2)(b)(ii)';
                        let ihlCitationDescription = 'Intentionally directing attacks against civilian objects, that is, objects which are not military objectives.';

                        if (relatedIncident) {
                          const typeLower = relatedIncident.damage_type.toLowerCase();
                          if (typeLower.includes('medical') || typeLower.includes('hospital') || typeLower.includes('clinic')) {
                            ihlCitationTitle = 'Rome Statute Article 8(2)(b)(ix)';
                            ihlCitationDescription = 'Intentionally directing attacks against buildings dedicated to religion, education, art, science or charitable purposes, historic monuments, hospitals and places where the sick and wounded are collected.';
                          } else if (typeLower.includes('residential') || typeLower.includes('apart') || typeLower.includes('house') || typeLower.includes('home')) {
                            ihlCitationTitle = 'Rome Statute Article 8(2)(b)(i) & (v)';
                            ihlCitationDescription = 'Intentionally directing attacks against civilian populations/objects, and the bombardment of undefended towns, villages, dwellings, or buildings.';
                          } else if (typeLower.includes('school') || typeLower.includes('education') || typeLower.includes('academy')) {
                            ihlCitationTitle = 'Rome Statute Article 8(2)(b)(ix)';
                            ihlCitationDescription = 'Intentionally directing attacks against buildings dedicated to education, arts, science, and places of civic gathering.';
                          }
                        }

                        return (
                          <div key={id} className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl space-y-4">
                            <div className="flex flex-wrap justify-between items-start gap-4 pb-3 border-b border-slate-800">
                              <div>
                                <span className="text-[9px] text-slate-500 font-bold font-numeric block">{id.toUpperCase()} • COMPILED VIA AI</span>
                                <h4 className="text-xs font-bold mt-0.5 text-white">{dos.title}</h4>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-[#D4AF37] font-bold flex items-center gap-1.5 justify-end">
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> {isSealedObj ? 'SEALED & NOTARIZED' : 'SECURED ON LEDGER'}
                                </span>
                                <span className="text-[9px] text-slate-500 font-numeric block mt-0.5">{new Date(dos.created_at).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* View Switcher Tabs */}
                            <div className="flex border-b border-slate-800/80 text-[10px] gap-2 pb-2">
                              <button 
                                onClick={() => setDossierViews(prev => ({ ...prev, [id]: 'standard' }))}
                                className={`px-3 py-1.5 rounded font-semibold transition-all ${viewMode === 'standard' ? 'bg-[#0A1628] text-[#D4AF37] border border-slate-700/60 font-bold' : 'text-slate-400 hover:text-white'}`}
                              >
                                Metadata System Log
                              </button>
                              <button 
                                onClick={() => setDossierViews(prev => ({ ...prev, [id]: 'hague' }))}
                                className={`px-3 py-1.5 rounded font-semibold transition-all flex items-center gap-1.5 ${viewMode === 'hague' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/30 font-bold shadow' : 'text-slate-400 hover:text-indigo-400'}`}
                              >
                                <Sparkles className="w-3 h-3 text-indigo-400" /> ICC Hague Court Docket
                              </button>
                            </div>

                            {viewMode === 'standard' ? (
                              <div className="prose prose-invert max-w-none text-slate-300 text-xs bg-[#0A1628] p-5 rounded-xl border border-slate-800 font-mono overflow-x-auto leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                                {dos.content}
                              </div>
                            ) : (
                              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-5 relative overflow-hidden font-sans">
                                {/* Court Watermark */}
                                <div className="absolute right-4 top-4 text-[45px] text-slate-900 font-bold select-none opacity-20 pointer-events-none font-serif">
                                  ICC-I
                                </div>

                                {/* Header */}
                                <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                                  <span className="text-[10px] tracking-widest font-bold text-slate-400 block uppercase">International Criminal Court (ICC)</span>
                                  <h4 className="text-xs font-serif font-bold text-white tracking-wide uppercase">Office of the Prosecutor — investigative division</h4>
                                  <div className="flex justify-center gap-4 text-[8px] text-slate-500 font-mono">
                                    <span>REF: ALTH-CIV-CASE-{id.toUpperCase()}</span>
                                    <span>•</span>
                                    <span>ARTICLE 15 RECORD</span>
                                  </div>
                                </div>

                                {/* Legal Metadata Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-b border-slate-800 pb-4">
                                  <div className="space-y-1.5">
                                    <div>
                                      <span className="text-[8px] text-slate-500 font-bold block uppercase">TARGET OBJECTIVITY</span>
                                      <span className="text-white font-medium">{relatedIncident ? relatedIncident.damage_type : 'Civilian Infrastructure'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-slate-500 font-bold block uppercase">LOCUS IN QUO (COORDINATES)</span>
                                      <span className="text-white font-mono">{relatedIncident ? `${relatedIncident.latitude} N, ${relatedIncident.longitude} E` : 'Pending Grid'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-slate-500 font-bold block uppercase">TEMPORAL FACTOR</span>
                                      <span className="text-white font-numeric">{relatedIncident ? new Date(relatedIncident.created_at).toLocaleString() : 'Recent Period'}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div>
                                      <span className="text-[8px] text-slate-500 font-bold block uppercase">COMPILER PROFILE</span>
                                      <span className="text-indigo-400 font-bold">{user ? user.full_name : 'Verified Core Oracle'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-slate-500 font-bold block uppercase">INTEGRITY CONFIDENCE INDEX</span>
                                      <span className="text-emerald-400 font-bold font-numeric">{relatedIncident ? `${relatedIncident.confidence_score}% Verified` : '95% Standard'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-slate-500 font-bold block uppercase">TRIBUNAL STATUS</span>
                                      {isSealedObj ? (
                                        <span className="text-[#D4AF37] font-bold">SEALED & NOTARIZED VIA LEDGER</span>
                                      ) : (
                                        <span className="text-yellow-500 font-bold">OPEN FOR CERTIFICATE SEAL</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* IHL Charge/Citation Block */}
                                <div className="bg-indigo-950/20 border border-indigo-950/30 p-3 rounded-lg space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{ihlCitationTitle}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 italic font-serif leading-relaxed">
                                    "{ihlCitationDescription}"
                                  </p>
                                </div>

                                {/* Custom Witness Statement Form / Affidavit */}
                                <div className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl space-y-3">
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Witness Affidavit (Firsthand Observations)</span>
                                    {witnessAff && (
                                      <span className="text-[9px] text-emerald-400 font-bold">✓ SWORN & SIGNED</span>
                                    )}
                                  </div>

                                  {witnessAff ? (
                                    <div className="space-y-2">
                                      <p className="text-[11px] text-slate-200 italic font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/50 whitespace-pre-wrap leading-relaxed">
                                        "{witnessAff.text}"
                                      </p>
                                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                                        <div>
                                          <span className="font-bold">Affiant: </span>
                                          <span className="text-slate-300">{witnessAff.signedBy}</span>
                                        </div>
                                        <div>
                                          <span className="font-bold">Sig Hash: </span>
                                          <span className="font-mono text-emerald-400">{witnessAff.signatureHash.slice(0, 16)}...</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <textarea
                                        value={draftText}
                                        onChange={(e) => setTempAffidavitText(prev => ({ ...prev, [id]: e.target.value }))}
                                        placeholder="Type firsthand witness statements, local volunteer observations, or specific casualty evidence here to legally bundle onto this official dossier docket..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        rows={2}
                                      />
                                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                                        <input 
                                          type="text" 
                                          id={`witness-name-${id}`}
                                          placeholder="Witness Name (e.g., Marcus Vance, Dr. Elena Rostova)"
                                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white grow max-w-xs focus:outline-none focus:border-indigo-500"
                                        />
                                        <button
                                          onClick={() => {
                                            const nameInput = document.getElementById(`witness-name-${id}`) as HTMLInputElement;
                                            const name = nameInput?.value || user?.full_name || 'Anonymous Humanitarian Witness';
                                            if (!draftText.trim()) {
                                              showToast('Affidavit statement cannot be empty.', 'error');
                                              return;
                                            }
                                            const mockHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                                            setWitnessAffidavits(prev => ({
                                              ...prev,
                                              [id]: {
                                                text: draftText,
                                                signedBy: name,
                                                signatureHash: mockHash
                                              }
                                            }));
                                            showToast(`Witness testimony signed by ${name}!`);
                                          }}
                                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded text-[10px] transition-colors shadow self-end"
                                        >
                                          Sign Affidavit
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Golden Wax Seal Visual Ceremony */}
                                {isSealedObj ? (
                                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3 py-3 bg-gradient-to-b from-amber-950/10 to-transparent border-t border-slate-800/60 rounded-b-xl">
                                    {/* Physical golden seal */}
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#AA7C11] p-1 shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center justify-center border border-amber-300">
                                      <div className="w-full h-full rounded-full border border-dashed border-amber-950 flex flex-col items-center justify-center bg-gradient-to-br from-amber-600 to-amber-700 text-[5px] font-bold text-amber-100 uppercase text-center select-none leading-none px-0.5">
                                        <span className="scale-[0.8] mb-0.5 text-[#FFD700]">★ SEALED ★</span>
                                        <span className="scale-[0.7]">ALETHEIA</span>
                                        <span className="scale-[0.7] text-[#FFD700]">SECURE</span>
                                      </div>
                                    </div>
                                    <div className="text-center sm:text-left space-y-0.5">
                                      <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">ALETHEIA LEGAL LEDGER LOCKED</span>
                                      <span className="text-[8px] text-slate-400 block">Dossier certified on public ledger by <strong className="text-slate-300">{isSealedObj.sealerName}</strong></span>
                                      <span className="text-[8px] text-slate-500 block font-mono">Registry Timestamp: {isSealedObj.date}</span>
                                    </div>
                                  </div>
                                ) : currentSealing ? (
                                  <div className="flex flex-col items-center justify-center py-4 space-y-2 bg-slate-900/40 rounded-xl border border-dashed border-indigo-500/30 animate-pulse">
                                    <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                                    <div className="text-center">
                                      <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest block">SECURELY NOTARIZING ON BLOCKCHAIN LEDGER...</span>
                                      <span className="text-[8px] text-slate-400 font-mono block mt-0.5">Hash Block: sha256({dos.cryptographic_proof.slice(0, 16)}...)</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-3 bg-indigo-950/10 border border-slate-800/60 rounded-xl space-y-2">
                                    <span className="text-[9px] text-slate-400 font-semibold text-center leading-normal max-w-sm px-2">
                                      Review all attached sources & logs. Legally notarize and lock this docket with a cryptographic certification.
                                    </span>
                                    <button
                                      onClick={() => {
                                        setIsSealing(prev => ({ ...prev, [id]: true }));
                                        setTimeout(() => {
                                          setIsSealing(prev => ({ ...prev, [id]: false }));
                                          setSealedDossiers(prev => ({
                                            ...prev,
                                            [id]: {
                                              sealed: true,
                                              sealerName: user?.full_name || 'Aletheia Verification Oracle',
                                              sealerOrg: user?.organization || 'Aletheia Consortium',
                                              date: new Date().toLocaleString()
                                            }
                                          }));
                                          showToast(`Evidence Dossier is now sealed!`, 'success');
                                        }, 1200);
                                      }}
                                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-[#0A1628] font-black text-[10px] rounded-lg flex items-center gap-1.5 shadow transition-all font-numeric hover:scale-[1.02]"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" /> Seal & Sign Ledger Certificate
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-slate-800/80 text-[10px]">
                              <div className="space-y-0.5 max-w-md">
                                <span className="text-slate-500 font-bold block uppercase tracking-wider">Blockchain Cryptographic Seal</span>
                                <span className="text-[#D4AF37] font-numeric block truncate font-mono">{dos.cryptographic_proof}</span>
                              </div>
                              <button
                                onClick={() => {
                                  window.print();
                                }}
                                className="bg-[#0A1628] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg border border-slate-800 shrink-0 transition-colors"
                              >
                                Export PDF Brief
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Create dossier widget */}
                  <div className="space-y-6">
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Generate Custom Dossier</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Select any verified incident from our ledger list to auto-compile evidence logs into a court-ready dossier file.
                      </p>

                      <div className="space-y-2">
                        {incidents.slice(0, 4).map(inc => (
                          <div key={inc.id} className="p-3 bg-[#0A1628] border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                            <div className="space-y-0.5 max-w-[130px]">
                              <h4 className="font-bold text-white truncate">{inc.title}</h4>
                              <span className="text-[10px] text-indigo-400 font-numeric block">{inc.confidence_score}% Verified</span>
                            </div>
                            <button
                              onClick={() => generateLegalDossier(inc.id)}
                              disabled={isGeneratingDossier === inc.id}
                              className="bg-indigo-600 hover:bg-indigo-500 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 text-white transition-all shadow"
                            >
                              {isGeneratingDossier === inc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5 shrink-0" />}
                              Compile
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}


            {/* ==========================================
                9. CLAIMS PORTAL PAGE
                ========================================== */}
            {currentPage === 'claims-portal' && (
              <div className="space-y-6">
                
                {/* Intro */}
                <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Reparations Allocation Engine</span>
                  <h2 className="text-xl font-bold">Compensation Claims Portal</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    File claims for structural damages, which automatically correlate with our certified satellite verification records. No manual assessment waits — Aletheia pre-populates payouts based on localized conflict severity indexes.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* File Claim form */}
                  <div className="lg:col-span-2 bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">File A Reconstruction Claim</h3>
                    
                    <form onSubmit={submitClaim} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Link Incident Coordinate</label>
                          <select
                            value={claimIncidentId}
                            onChange={(e) => {
                              setClaimIncidentId(e.target.value);
                              autoFillClaim(e.target.value);
                            }}
                            className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                          >
                            <option value="">-- Choose Incident Coordinate --</option>
                            {incidents.map(inc => (
                              <option key={inc.id} value={inc.id}>{inc.id.toUpperCase()}: {inc.title.slice(0, 24)}...</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Claimant Name (Owner/MOH)</label>
                          <input
                            type="text"
                            required
                            placeholder="Petro Shevchenko"
                            value={claimantName}
                            onChange={(e) => setClaimantName(e.target.value)}
                            className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Property Value Estimate ($ USD)</label>
                          <input
                            type="number"
                            required
                            placeholder="85000"
                            value={claimEstimate}
                            onChange={(e) => setClaimEstimate(e.target.value)}
                            className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Compensation Compensation Tier</label>
                          <select
                            value={claimTier}
                            onChange={(e) => setClaimTier(e.target.value)}
                            className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold"
                          >
                            <option value="Tier 1 - Total Loss Repatriation">Tier 1 - Total Loss Repatriation</option>
                            <option value="Tier 2 - Major Structural Integrity Recovery">Tier 2 - Major Structural Integrity Recovery</option>
                            <option value="Tier 3 - Partial Restoration / Medical Support">Tier 3 - Partial Restoration / Medical Support</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Claim Details & AI Auto-fill Evidence Proofs</label>
                        <textarea
                          rows={4}
                          value={claimNotes}
                          onChange={(e) => setClaimNotes(e.target.value)}
                          placeholder="Provide details of damage or click an incident above to run satellite evidence auto-filling..."
                          className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold font-numeric leading-relaxed"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={isAutoFilling}
                        className="w-full py-3 bg-[#D4AF37] text-[#0A1628] font-bold rounded-xl text-xs hover:bg-[#FFD700] transition-colors flex items-center justify-center gap-2 shadow"
                      >
                        {isAutoFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                        Submit Compensation Reparation Claim
                      </button>
                    </form>
                  </div>

                  {/* Claims list */}
                  <div className="space-y-6">
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Active Reparation Claims</h3>
                      
                      <div className="space-y-3">
                        {claims.map(clm => (
                          <div key={clm.id} className="p-4 rounded-xl bg-[#0A1628] border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-400 uppercase font-numeric">{clm.id.toUpperCase()}</span>
                              <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${
                                clm.status === 'approved' ? 'bg-emerald-950 text-emerald-400' :
                                clm.status === 'paid' ? 'bg-indigo-950 text-indigo-400' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {clm.status}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{clm.claimant_name}</h4>
                            <p className="text-[10px] text-slate-400 leading-snug truncate">Est. Value: <span className="font-bold text-white font-numeric">${clm.claim_data.property_value_estimate.toLocaleString()}</span></p>
                            <p className="text-[9px] text-slate-500 font-numeric block">{clm.claim_data.compensation_tier}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}


            {/* ==========================================
                9. AI INVESTIGATIVE AGENT PAGE
                ========================================== */}
            {currentPage === 'ai-assistant' && (
              <div className="space-y-6">
                
                {/* Intro Title Banner */}
                <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">ALETHEIA COGNITIVE REASONING ENGINE</span>
                  </div>
                  <h2 className="text-xl font-bold">AI Investigative Agent & Legal Counsel</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    Deploy Aletheia's specialized Gemini-powered agent personas to cross-reference open-source feeds, analyze potential violations of International Humanitarian Law, structure firsthand affidavits, and calculate repair compensation tiers.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Agent Configurations */}
                  <div className="space-y-6">
                    <div className="bg-[#1A2A4A] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2.5">Agent Control Console</h3>
                      
                      {/* Persona selector */}
                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Select Agent Persona</label>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setSelectedAgentRole('ihl-prosecutor');
                              setAgentMessages([
                                { role: 'assistant', content: "⚖️ **[IHL Prosecutorial Analyst Active]**\n\nGreetings. I specialize in the legal frameworks of International Humanitarian Law, including the Geneva Conventions of 1949 and Rome Statute Article 8. Ask me to analyze an incident to check for potential violations or outline the proof standards required for court." }
                              ]);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                              selectedAgentRole === 'ihl-prosecutor' 
                                ? 'bg-indigo-950/40 border-indigo-500/50 text-white' 
                                : 'bg-[#0A1628]/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="text-lg shrink-0 mt-0.5">⚖️</span>
                            <div>
                              <h4 className="text-xs font-bold">IHL Prosecutorial Analyst</h4>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Analyzes conflict events against Geneva Conventions & Rome Statute Article 8 violations.</p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAgentRole('osint-expert');
                              setAgentMessages([
                                { role: 'assistant', content: "🛰️ **[OSINT Geospatial Specialist Active]**\n\nGreetings. I specialize in image geolocation, EXIF metadata extraction, Sentinel-2 Synthetic Aperture Radar (SAR) footprints, and digital source verification. Ask me how to authenticate conflict-zone imagery or parse digital records." }
                              ]);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                              selectedAgentRole === 'osint-expert' 
                                ? 'bg-indigo-950/40 border-indigo-500/50 text-white' 
                                : 'bg-[#0A1628]/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="text-lg shrink-0 mt-0.5">🛰️</span>
                            <div>
                              <h4 className="text-xs font-bold">OSINT Geospatial Specialist</h4>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Guides remote sensing satellite indices, photo EXIF verification, and landmark triangulation.</p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAgentRole('claims-officer');
                              setAgentMessages([
                                { role: 'assistant', content: "🪙 **[Humanitarian Claims Officer Active]**\n\nGreetings. I specialize in calculating building damage reparations, estimating restoration values, matching claims to proper tiers, and forming robust financial cases for recovery." }
                              ]);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                              selectedAgentRole === 'claims-officer' 
                                ? 'bg-indigo-950/40 border-indigo-500/50 text-white' 
                                : 'bg-[#0A1628]/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="text-lg shrink-0 mt-0.5">🪙</span>
                            <div>
                              <h4 className="text-xs font-bold">Humanitarian Claims Officer</h4>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Helps calculate structural values, draft damage compensation notes, and evaluate tiers.</p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAgentRole('affidavit-notary');
                              setAgentMessages([
                                { role: 'assistant', content: "📜 **[Affidavit Witness Notary Active]**\n\nGreetings. I assist in drafting clean, chronological firsthand observer testimonies suitable for international court dockets. Ask me how to structure your personal statements facts." }
                              ]);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                              selectedAgentRole === 'affidavit-notary' 
                                ? 'bg-indigo-950/40 border-indigo-500/50 text-white' 
                                : 'bg-[#0A1628]/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="text-lg shrink-0 mt-0.5">📜</span>
                            <div>
                              <h4 className="text-xs font-bold">Affidavit Witness Notary</h4>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Transforms raw observations into logically sound, admissible witness testimonies.</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Grounding Selector */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Link Incident Context</label>
                        <select
                          value={agentContextIncidentId}
                          onChange={(e) => {
                            setAgentContextIncidentId(e.target.value);
                            const found = incidents.find(i => i.id === e.target.value);
                            if (found) {
                              setAgentMessages(prev => [
                                ...prev,
                                { role: 'assistant', content: `📍 **[Context Grounding Active]** Linked to **${found.id.toUpperCase()}: ${found.title}**. My analysis will now actively leverage the coordinates, reported damage severity, and attached verification chain of custody records as live context.` }
                              ]);
                            } else {
                              setAgentMessages(prev => [
                                ...prev,
                                { role: 'assistant', content: `🔄 Context unlinked. I am now analyzing general conflict-zone evidence.` }
                              ]);
                            }
                          }}
                          className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                        >
                          <option value="">-- No Linked Context (General Advice) --</option>
                          {incidents.map(inc => (
                            <option key={inc.id} value={inc.id}>{inc.id.toUpperCase()}: {inc.title.slice(0, 24)}...</option>
                          ))}
                        </select>
                        <p className="text-[9px] text-slate-400 leading-normal">
                          Linking an incident feeds satellite coordinate indices, damage type registries, and current verification status into the AI's prompts.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Interactive Chat Terminal */}
                  <div className="lg:col-span-2 flex flex-col h-[650px] bg-[#1A2A4A] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                    
                    {/* Chat Header */}
                    <div className="p-4 bg-[#122037] border-b border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                          {selectedAgentRole === 'ihl-prosecutor' ? '⚖️' :
                           selectedAgentRole === 'osint-expert' ? '🛰️' :
                           selectedAgentRole === 'claims-officer' ? '🪙' : '📜'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                              {selectedAgentRole === 'ihl-prosecutor' ? 'IHL Prosecutorial Analyst' :
                               selectedAgentRole === 'osint-expert' ? 'OSINT Geospatial Specialist' :
                               selectedAgentRole === 'claims-officer' ? 'Humanitarian Claims Officer' : 'Affidavit Witness Notary'}
                            </h3>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          </div>
                          <p className="text-[9px] text-[#D4AF37] font-semibold uppercase tracking-widest mt-0.5">
                            {agentContextIncidentId 
                              ? `Context Grounded: ${agentContextIncidentId.toUpperCase()}` 
                              : 'General Intelligence Directive'}
                          </p>
                        </div>
                      </div>

                      {/* Clear logs option */}
                      <button
                        onClick={() => {
                          setAgentMessages([
                            { role: 'assistant', content: `Chat logs cleared. Re-initialized ${selectedAgentRole === 'ihl-prosecutor' ? 'IHL Prosecutorial Analyst' : selectedAgentRole === 'osint-expert' ? 'OSINT Geospatial Specialist' : selectedAgentRole === 'claims-officer' ? 'Humanitarian Claims Officer' : 'Affidavit Witness Notary'} counseling.` }
                          ]);
                        }}
                        className="p-1 px-2 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 hover:text-white rounded transition-colors"
                      >
                        Reset Conversation
                      </button>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0F1E36]/30">
                      {agentMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3.5 max-w-[85%] ${
                            msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-xs select-none ${
                            msg.role === 'user' 
                              ? 'bg-[#D4AF37] text-[#0A1628]' 
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-500/20'
                          }`}>
                            {msg.role === 'user' ? 'U' : 'A'}
                          </div>

                          <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 whitespace-pre-line border shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-100'
                              : 'bg-[#0A1628]/90 border-slate-800 text-slate-200'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}

                      {isAgentTyping && (
                        <div className="flex items-start gap-3.5 max-w-[80%] mr-auto">
                          <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-xs bg-indigo-950 text-indigo-300 border border-indigo-500/20 animate-pulse">
                            AI
                          </div>
                          <div className="p-4 rounded-2xl text-xs bg-[#0A1628]/90 border border-slate-800 text-slate-400 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-gold animate-spin" />
                            <span>Aletheia agent processing intelligence matrix...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preset Suggestion Prompts */}
                    <div className="px-4 py-2 bg-[#122037] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
                      <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">Suggestions:</span>
                      {selectedAgentRole === 'ihl-prosecutor' && (
                        <>
                          <button
                            onClick={() => setAgentInputText("Does direct damage to a residential building violate Rome Statute Article 8?")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            Does structural targeting violate IHL?
                          </button>
                          <button
                            onClick={() => setAgentInputText("What kind of additional records are required to prove intentional destruction in court?")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            What proofs establish intent?
                          </button>
                        </>
                      )}
                      {selectedAgentRole === 'osint-expert' && (
                        <>
                          <button
                            onClick={() => setAgentInputText("How do I match raw photographs to high-resolution Sentinel satellite coordinates?")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            Triangulate photo with Sentinel
                          </button>
                          <button
                            onClick={() => setAgentInputText("Explain how EXIF tags and camera angles can geolocate video evidence of a hospital facade.")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            How do I geolocate hospital facades?
                          </button>
                        </>
                      )}
                      {selectedAgentRole === 'claims-officer' && (
                        <>
                          <button
                            onClick={() => setAgentInputText("How do I match property damage records to Tier 1 vs Tier 2 rebuilding compensation?")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            Match damage to claim tiers
                          </button>
                          <button
                            onClick={() => setAgentInputText("Write a draft financial compensation note for a partially restored medical facility.")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            Draft clinic compensation note
                          </button>
                        </>
                      )}
                      {selectedAgentRole === 'affidavit-notary' && (
                        <>
                          <button
                            onClick={() => setAgentInputText("Help me sequentially outline my raw observations into a formal testimony statement.")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            Structure sequential statement
                          </button>
                          <button
                            onClick={() => setAgentInputText("What objective language constraints must I follow for affidavit submissions to remain court-admissible?")}
                            className="text-[10px] px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-300 hover:text-white shrink-0 hover:border-slate-700 transition-colors"
                          >
                            Avoid court speculation language
                          </button>
                        </>
                      )}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={sendAgentMessage} className="p-4 bg-[#122037] border-t border-slate-800 flex gap-3 shrink-0">
                      <input
                        type="text"
                        value={agentInputText}
                        onChange={(e) => setAgentInputText(e.target.value)}
                        placeholder={`Query your Aletheia ${selectedAgentRole === 'ihl-prosecutor' ? 'IHL Prosecutorial Analyst' : selectedAgentRole === 'osint-expert' ? 'OSINT Specialist' : selectedAgentRole === 'claims-officer' ? 'Claims Officer' : 'Affidavit Notary'}...`}
                        disabled={isAgentTyping}
                        className="flex-1 bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={isAgentTyping || !agentInputText.trim()}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" /> Ask Agent
                      </button>
                    </form>

                  </div>

                </div>
              </div>
            )}


            {/* ==========================================
                9.5 OSINT & LEGAL TOOLBOX PAGE
                ========================================== */}
            {currentPage === 'osint-toolbox' && (
              <OSINTProductivitySuite
                incidents={incidents}
                user={user}
                showToast={showToast}
                setIncidents={setIncidents}
                witnessAffidavits={witnessAffidavits}
                sealedDossiers={sealedDossiers}
              />
            )}


            {/* ==========================================
                10. SETTINGS PAGE
                ========================================== */}
            {currentPage === 'settings-page' && (
              <div className="space-y-6">
                
                <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">ALETHEIA PLATFORM CORE</span>
                  <h2 className="text-xl font-bold">System Configuration & Settings</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Configure your satellite polling windows, OSINT threshold radius parameters, blockchain verification keys, and manage localized observer directories.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* System config block */}
                  <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold pb-2 border-b border-slate-800">Operational Parameters</h3>
                    
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spatial correlation radius (meters)</label>
                        <input
                          type="number"
                          defaultValue="500"
                          className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orbital satellite pass cycle (hours)</label>
                        <input
                          type="number"
                          defaultValue="6"
                          className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minimum confirmation sources required</label>
                        <input
                          type="number"
                          defaultValue="3"
                          className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                        />
                      </div>

                      <button
                        onClick={() => showToast('Operational thresholds updated locally.')}
                        className="w-full py-2.5 bg-gold text-[#0A1628] font-bold rounded-xl"
                      >
                        Update Parameters
                      </button>
                    </div>
                  </div>

                  {/* Observer stats & info */}
                  <div className="bg-[#1A2A4A] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold pb-2 border-b border-slate-800">Your Observer Registry Data</h3>
                    
                    <div className="space-y-4 text-xs">
                      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">Identity Check</span>
                          <span className="text-emerald-400 font-bold">CRTYPTOGRAPHICALLY VERIFIED</span>
                        </div>
                        <p className="text-[10px] text-slate-300">
                          Your profile has been secured with SHA-256 local ledger checks, enabling direct submissions of structural damage damage coordinates.
                        </p>
                      </div>

                      <div className="divide-y divide-slate-800 text-xs">
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-400 font-medium">Logged observer:</span>
                          <span className="text-white font-bold">{user ? user.full_name : 'Guest Observer'}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-400 font-medium">Role credentials:</span>
                          <span className="text-white font-bold uppercase">{user ? user.role : 'Observer'}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-400 font-medium">Points collected:</span>
                          <span className="text-gold font-bold font-numeric">{user ? user.verification_points : 0} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ==========================================
          SUBMIT NEW RAW EVIDENCE MODAL
          ========================================== */}
      {isNewIncidentOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1A2A4A] border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2">
                <Flame className="text-[#D4AF37] w-4 h-4 shrink-0" /> Report Conflict Damage Incident
              </h3>
              <button
                onClick={() => setIsNewIncidentOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={submitIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="Kharkiv Residential Sector 4 strike"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Damage Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  >
                    <option value="Residential Building">Residential Building</option>
                    <option value="Industrial/Agricultural">Industrial/Agricultural</option>
                    <option value="Medical Infrastructure">Medical Infrastructure</option>
                    <option value="Critical Utility/Energy">Critical Utility/Energy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Estimated Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Latitude coordinate</label>
                  <input
                    type="text"
                    required
                    placeholder="48.3794"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Longitude coordinate</label>
                  <input
                    type="text"
                    required
                    placeholder="31.1656"
                    value={newLon}
                    onChange={(e) => setNewLon(e.target.value)}
                    className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white font-numeric"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Detailed Damage Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe structural failure, fire outbreaks, or civilian evacuation actions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#0A1628] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                ></textarea>
              </div>

              <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center space-y-1 bg-slate-950/20">
                <Upload className="w-5 h-5 text-slate-500 mx-auto" />
                <p className="text-[10px] text-slate-400 font-bold">DRAG & DROP IMAGE/VIDEO EVIDENCE</p>
                <p className="text-[9px] text-slate-500">Supports direct geotag metadata verification checks (JPEG/PNG/MP4)</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] text-[#0A1628] font-bold rounded-xl text-xs hover:bg-[#FFD700] transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 shrink-0" /> Submit Raw Evidence to Core
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
