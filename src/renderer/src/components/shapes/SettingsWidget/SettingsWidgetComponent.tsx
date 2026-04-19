import React, { useState } from 'react'
import { BaseBoxShapeUtil, HTMLContainer } from 'tldraw'
import { Settings, Shield, Keyboard, Monitor, Key, Zap } from 'lucide-react'

export const SettingsWidgetComponent: React.FC<{ shape: any }> = ({ shape }) => {
  const [activeTab, setActiveTab] = useState('general')

  const Section = ({ title, icon: Icon, active, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${active ? 'bg-primary/20 text-primary' : 'text-on_surface_variant hover:bg-white/5 hover:text-white'}`}
    >
      <Icon size={16} />
      <span className="text-sm font-medium">{title}</span>
    </button>
  )

  return (
    <HTMLContainer
      id={shape.id}
      className="w-full h-full rounded-[16px] overflow-hidden flex pointer-events-auto"
      style={{
        backgroundColor: 'rgba(42, 42, 44, 0.7)', // surface-container-high
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
        // @ts-ignore - Electron specific
        WebkitAppRegion: 'no-drag'
      }}
    >
      {/* Left Sidebar */}
      <div className="w-1/3 bg-surface_container_lowest/50 border-r border-white/5 p-3 space-y-1">
        <div className="px-2 py-3 mb-2 flex items-center space-x-2 text-white">
          <Settings size={18} className="text-primary"/>
          <span className="font-semibold text-sm">Settings</span>
        </div>
        
        <Section title="General" icon={Monitor} active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
        <Section title="Shortcuts" icon={Keyboard} active={activeTab === 'shortcuts'} onClick={() => setActiveTab('shortcuts')} />
        <Section title="API Keys" icon={Key} active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
        <Section title="AI Ghost" icon={Zap} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        <Section title="Privacy" icon={Shield} active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} />
      </div>

      {/* Right Content Area */}
      <div className="w-2/3 p-6 overflow-y-auto no-scrollbar" onPointerDown={(e) => e.stopPropagation()}>
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-white text-lg font-semibold tracking-tight">General Workflow</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-medium">Show Tab List</div>
                  <div className="text-on_surface_variant text-[11px]">Display active native OS tabs grouped at the top.</div>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(170,199,255,0.3)]">
                  <div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-medium">Canvas Grid</div>
                  <div className="text-on_surface_variant text-[11px]">Show dot-grid background on the canvas naturally.</div>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(170,199,255,0.3)]">
                  <div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="text-white text-sm font-medium">Default Search Engine</div>
                <select className="w-full bg-surface_container_lowest border border-white/10 rounded-lg p-2 text-white text-sm outline-none cursor-pointer">
                  <option>Google</option>
                  <option>DuckDuckGo</option>
                  <option>Perplexity</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'general' && (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <Settings size={32} className="text-white mb-3" />
            <p className="text-xs text-white text-center">These settings are coming<br/>in the Ghost Cursor (V2) update.</p>
          </div>
        )}
      </div>
    </HTMLContainer>
  )
}
