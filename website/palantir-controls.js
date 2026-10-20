'use strict';

// A curated browser-only view of the real menu's labels and initial values.
// Source: palantir-main/ui/tabs/{main,visuals,combat,auto}.lua,
// ui/graphics_performance.lua, and utility/librarys/managers/{Save,Theme}Manager.lua.
// These records contain no game callbacks. Actions are handled by the website.
window.PALANTIR_PREVIEW_TABS = [
  {
    id: 'main', label: 'Main', icon: 'icon-home',
    columns: [
      [
        {title: 'Movement', controls: [
          {type: 'toggle', id: 'multiply_s', label: 'Walkspeed Multiplier', value: false},
          {type: 'toggle', id: 'infinite_jump', label: 'Infinite Jump', value: false},
          {type: 'toggle', id: 'fly', label: 'Fly', value: false}
        ]},
        {title: 'Options', controls: [
          {type: 'range', id: 'walk_speed', label: 'Walk Speed', value: 95, min: 1, max: 250, step: 0.1, suffix: ''},
          {type: 'range', id: 'fly_speed', label: 'Fly Speed', value: 95, min: 1, max: 350, step: 0.1, suffix: ''}
        ]}
      ],
      [
        {title: 'Removals', controls: [
          {type: 'toggle', id: 'no_shadows', label: 'No Shadows', value: false},
          {type: 'toggle', id: 'no_blur', label: 'No Blur', value: false},
          {type: 'toggle', id: 'no_fog', label: 'No Fog', value: false}
        ]},
        {title: 'Graphics Performance', controls: [
          {type: 'toggle', id: 'graphics_performance', label: 'Graphics Performance', value: false},
          {type: 'select', id: 'graphics_quality', label: 'Graphics Quality', value: 'Medium', options: ['Unchanged', 'Medium', 'Low']},
          {type: 'select', id: 'graphics_textures', label: 'Texture Quality', value: 'Low', options: ['Unchanged', 'Medium', 'Low']},
          {type: 'toggle', id: 'graphics_limit_fps', label: 'Set FPS Cap', value: false},
          {type: 'range', id: 'graphics_fps_cap', label: 'FPS Cap', value: 120, min: 30, max: 360, step: 1, suffix: ' FPS'}
        ]}
      ]
    ]
  },
  {
    id: 'visuals', label: 'Visuals', icon: 'icon-visuals',
    columns: [
      [
        {title: 'Modifiers', controls: [
          {type: 'toggle', id: 'streamer_mode', label: 'Streamer Mode', value: false},
          {type: 'toggle', id: 'full_bright', label: 'Full Bright', value: false},
          {type: 'range', id: 'fullbright_intensity', label: 'Intensity', value: 100, min: 0, max: 100, step: 1, suffix: '%'}
        ]},
        {title: 'Visuals / Chests', controls: [
          {type: 'toggle', id: 'chest_esp', label: 'Chest ESP', value: false},
          {type: 'toggle', id: 'chest_esp_show_opened', label: 'Show Opened Chests', value: false}
        ]}
      ],
      [
        {title: 'ESP / Player', controls: [
          // Player ESP starts enabled in an ordinary, non-silent session.
          {type: 'toggle', id: 'player_esp', label: 'Player ESP', value: true},
          {type: 'toggle', id: 'esp_healthbar', label: 'Player Healthbars', value: false},
          {type: 'toggle', id: 'esp_boxes', label: 'Player Boxes', value: false},
          {type: 'toggle', id: 'esp_nametags', label: 'Player Names', value: true}
        ]},
        {title: 'ESP / Global', controls: [
          {type: 'toggle', id: 'esp_drawing', label: 'Drawing ESP', value: false},
          {type: 'select', id: 'esp_drawing_font', label: 'Drawing Font', value: 'Plex', options: ['UI', 'System', 'Plex', 'Monospace']},
          {type: 'range', id: 'esp_update_rate', label: 'ESP Label Update Rate', value: 2, min: 1, max: 60, step: 1, suffix: '/s'},
          {type: 'toggle', id: 'esp_last_seen', label: 'Last Seen Markers', value: true}
        ]}
      ]
    ]
  },
  {
    id: 'combat', label: 'Combat', icon: 'icon-defense',
    columns: [
      [
        {title: 'Auto Defense / Main', controls: [
          {type: 'toggle', id: 'auto_parry', label: 'Auto Defense', value: false},
          {type: 'toggle', id: 'sound_defense', label: 'Sound Attack Detection', value: true},
          {type: 'toggle', id: 'pvp_manual_moves', label: 'Manual-Only PvP Moves', value: false},
          {type: 'note', text: 'Initial manual moves: Vent, Hair Spray, Parasitic Leech.'},
          {type: 'toggle', id: 'defense_trace', label: 'Defense Trace', value: false}
        ]},
        {title: 'Auto Defense / PVP', controls: [
          {type: 'toggle', id: 'pvp_roll_cancel', label: 'Roll Cancel', value: false},
          {type: 'range', id: 'pvp_roll_cancel_chance', label: 'Cancel Chance', value: 90, min: 1, max: 100, step: 0.1, suffix: '%'},
          {type: 'range', id: 'pvp_parry_chance', label: 'Parry Chance', value: 100, min: 1, max: 100, step: 0.1, suffix: '%'}
        ]}
      ],
      [
        {title: 'Anim Speed Changer', controls: [
          {type: 'toggle', id: 'anim_speed_changer', label: 'Anim Speed Changer', value: false},
          {type: 'toggle', id: 'switch_speeds', label: 'Switch Speed', value: false}
        ]},
        {title: 'Timing Builder', controls: [
          {type: 'toggle', id: 'show_timing_builder', label: 'Show Timing Builder', value: false},
          {type: 'button', id: 'reload_timings', label: 'Reload Timings', action: 'preview_unavailable'},
          {type: 'note', text: 'Timing tools and defense actions require the game. This preview changes browser settings only.'}
        ]}
      ]
    ]
  },
  {
    id: 'automation', label: 'Automation', icon: 'icon-automation',
    columns: [
      [
        {title: 'Automation / General', controls: [
          {type: 'toggle', id: 'auto_sprint', label: 'Auto Sprint', value: false},
          {type: 'toggle', id: 'auto_equip_weapon', label: 'Auto Equip Weapon', value: false},
          {type: 'toggle', id: 'auto_decline_guild_invites', label: 'Auto Decline Guild Invites', value: false},
          {type: 'toggle', id: 'auto_chime_requeue', label: 'Auto Chime Requeue', value: false}
        ]},
        {title: 'Auto Loot', controls: [
          {type: 'toggle', id: 'auto_loot', label: 'Auto Loot', value: false},
          {type: 'toggle', id: 'notify_on_loot', label: 'Notify On Loot', value: false},
          {type: 'toggle', id: 'play_sound_noti', label: 'Play Sound Noti', value: false}
        ]}
      ],
      [
        {title: 'Auto Progression', controls: [
          {type: 'select', id: 'auto_progress_method', label: 'Method', value: 'Ferryman', options: ['Ferryman', 'Saramed']},
          {type: 'toggle', id: 'auto_progress_shrined', label: 'Start Shrined', value: false},
          {type: 'button', id: 'auto_progress', label: 'Auto Progress', action: 'preview_unavailable'}
        ]},
        {title: 'Config', controls: [
          {type: 'toggle', id: 'show_farm_status', label: 'Show Farm Status', value: true},
          {type: 'toggle', id: 'allow_automation_use_attunements', label: 'Use Attunements', value: true},
          {type: 'button', id: 'stop_automation', label: 'Stop Automation', action: 'preview_unavailable'},
          {type: 'note', text: 'No farms or game actions run in this browser preview.'}
        ]}
      ]
    ]
  },
  {
    id: 'ui', label: 'UI', icon: 'icon-profiles',
    columns: [
      [
        {title: 'Themes', controls: [
          {type: 'color', id: 'BackgroundColor', label: 'Background color', value: '#000000'},
          {type: 'color', id: 'MainColor', label: 'Main color', value: '#0c0c0c'},
          {type: 'color', id: 'AccentColor', label: 'Accent color', value: '#d4d4d4'},
          {type: 'color', id: 'OutlineColor', label: 'Outline color', value: '#252525'},
          {type: 'color', id: 'FontColor', label: 'Font color', value: '#999999'},
          {type: 'select', id: 'ThemeManager_ThemeList', label: 'Theme list', value: 'Palantir', options: ['Palantir', 'Volt']}
        ]}
      ],
      [
        {title: 'Configuration', controls: [
          {type: 'text', id: 'SaveManager_ConfigName', label: 'Config name', value: ''},
          {type: 'button', id: 'preview_save', label: 'Save browser preview', action: 'preview_save'},
          {type: 'button', id: 'preview_reset', label: 'Reset browser preview', action: 'preview_reset'}
        ]},
        {title: 'Performance', controls: [
          {type: 'toggle', id: 'PerformanceProfiling', label: 'Performance Profiling', value: false},
          {type: 'toggle', id: 'ShowPerformanceReport', label: 'Show Performance Report', value: false},
          {type: 'button', id: 'refresh_performance_report', label: 'Refresh Performance Report', action: 'preview_unavailable'}
        ]},
        {title: 'Other', controls: [
          {type: 'toggle', id: 'UIAnimations', label: 'UI Animations', value: true},
          {type: 'toggle', id: 'KeybindShower', label: 'Show Keybinds', value: false},
          {type: 'toggle', id: 'Watermark', label: 'Watermark', value: true}
        ]}
      ]
    ]
  }
];
