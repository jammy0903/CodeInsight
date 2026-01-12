/**
 * 테마 색상 정의
 *
 * soft: 라벤더-피치 (부드러운 여성적 톤)
 * dark: 남색-차콜 (시크한 남성적 톤)
 * minimal: 브라운-베이지 (중성적 미니멀 톤)
 */

export type ThemeType = 'soft' | 'dark' | 'minimal';

export interface ThemeColors {
  // 레이아웃 (TopBar, Sidebar, Footer)
  layout: {
    pageBg: string;
    topBarBg: string;
    topBarBorder: string;
    topBarText: string;
    topBarTextMuted: string;
    topBarButtonBg: string;
    topBarButtonHover: string;
    sidebarBg: string;
    sidebarBorder: string;
    sidebarText: string;
    sidebarTextMuted: string;
    sidebarItemBg: string;
    sidebarItemActive: string;
    sidebarItemHover: string;
    footerBg: string;
    footerBorder: string;
    footerText: string;
    footerTextMuted: string;
    footerLinkHover: string;
    footerSocialBg: string;
    footerSocialHover: string;
  };
  // 설명 패널
  explanation: {
    bgGradient: string;
    headerGradient: string;
    headerBorder: string;
    text: string;
    textMuted: string;
    buttonBg: string;
    buttonBorder: string;
    buttonText: string;
    buttonHover: string;
    counterBg: string;
    quizGradient: string;
    quizHoverGradient: string;
    quizText: string;
  };
  // 메모리 패널
  memory: {
    stackBg: string;
    stackLabel: string;
    stackBorder: string;
    heapBg: string;
    heapLabel: string;
    heapBorder: string;
    dataBg: string;
    dataLabel: string;
    textBg: string;
    textLabel: string;
    // 카드 색상
    cardBg: string;
    cardText: string;
    cardMuted: string;
    // 레지스터/인디케이터
    sectionText: string;
  };
  // 대시보드 (나의 현황)
  dashboard: {
    pageBg: string;
    cardBg: string;
    cardBorder: string;
    title: string;
    text: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    sectionHeaderBg: string;
    statCardBg: string;
    progressBg: string;
    emptyBg: string;
  };
  // 레슨 페이지
  lesson: {
    pageBg: string;
    panelBg: string;
    panelBorder: string;
    codeHeaderBg: string;
    codeHeaderText: string;
    codeBg: string;
    terminalBorder: string;
    // 탭 (메모리/AI)
    tabActiveBg: string;
    tabActiveText: string;
    tabInactiveBg: string;
    tabInactiveText: string;
    memoryBg: string;
    chatBg: string;
    // 완료 뷰
    completedBg: string;
    completedBorder: string;
    completedIconBg: string;
    completedText: string;
    completedTextMuted: string;
    buttonPrimaryBg: string;
    buttonSecondaryBg: string;
    buttonSecondaryBorder: string;
    buttonSecondaryText: string;
    // 헤더
    headerText: string;
    headerTextMuted: string;
  };
}

export const themes: Record<ThemeType, ThemeColors> = {
  // 소프트 테마 (라벤더-피치)
  soft: {
    layout: {
      pageBg: '#faf8fc',
      topBarBg: 'linear-gradient(to right, rgba(250,248,252,0.8), rgba(250,248,252,0.95), rgba(250,248,252,0.8))',
      topBarBorder: 'rgba(235,228,237,0.5)',
      topBarText: '#6b5a7a',
      topBarTextMuted: '#a08eb0',
      topBarButtonBg: '#f3eef8',
      topBarButtonHover: '#ebe4ed',
      sidebarBg: '#faf8fc',
      sidebarBorder: '#ebe4ed',
      sidebarText: '#6b5a7a',
      sidebarTextMuted: '#a08eb0',
      sidebarItemBg: '#faf8fc',
      sidebarItemActive: '#a855f7',
      sidebarItemHover: '#f3eef8',
      footerBg: '#f3eef8',
      footerBorder: '#ebe4ed',
      footerText: '#6b5a7a',
      footerTextMuted: '#a08eb0',
      footerLinkHover: '#7c6b8a',
      footerSocialBg: '#ebe4ed',
      footerSocialHover: '#a855f7',
    },
    explanation: {
      bgGradient: 'linear-gradient(135deg, #faf8fc 0%, #fdf8f6 100%)',
      headerGradient: 'linear-gradient(90deg, #f3eef8 0%, #fceef0 100%)',
      headerBorder: '#ebe4ed',
      text: '#7c6b8a',
      textMuted: '#a08eb0',
      buttonBg: 'rgba(255,255,255,0.8)',
      buttonBorder: '#e9d5ff',
      buttonText: '#a855f7',
      buttonHover: '#faf5ff',
      counterBg: 'rgba(255,255,255,0.8)',
      quizGradient: 'linear-gradient(to right, #fde68a, #fdba74)',
      quizHoverGradient: 'linear-gradient(to right, #fcd34d, #fb923c)',
      quizText: '#92400e',
    },
    memory: {
      stackBg: '#FFF5F7',
      stackLabel: '#be185d',
      stackBorder: '#D63384',
      heapBg: '#e8f5ec',
      heapLabel: '#3d7a5a',
      heapBorder: '#4a9d6b',
      dataBg: '#ede9f5',
      dataLabel: '#7c5ac7',
      textBg: '#e5f0f3',
      textLabel: '#4a8a9e',
      cardBg: '#ffffff',
      cardText: '#1f2937',
      cardMuted: '#6b7280',
      sectionText: '#374151',
    },
    dashboard: {
      pageBg: '#faf8fc',
      cardBg: '#ffffff',
      cardBorder: '#ebe4ed',
      title: '#7c6b8a',
      text: '#6b5a7a',
      textMuted: '#a08eb0',
      accent: '#a855f7',
      accentHover: '#9333ea',
      sectionHeaderBg: '#f3eef8',
      statCardBg: '#faf5ff',
      progressBg: '#e9d5ff',
      emptyBg: '#fdf8fc',
    },
    lesson: {
      pageBg: '#faf8fc',
      panelBg: '#ffffff',
      panelBorder: '#ebe4ed',
      codeHeaderBg: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
      codeHeaderText: '#e5e5e5',
      codeBg: '#ffffff',
      terminalBorder: '#ebe4ed',
      tabActiveBg: 'linear-gradient(135deg, #f3eef8 0%, #fceef0 100%)',
      tabActiveText: '#7c6b8a',
      tabInactiveBg: '#faf8fc',
      tabInactiveText: '#a08eb0',
      memoryBg: 'linear-gradient(135deg, #FFF5F7 0%, #fceef0 100%)',
      chatBg: 'linear-gradient(135deg, #FFFBF5 0%, #FFF9F2 100%)',
      completedBg: 'linear-gradient(135deg, #f3eef8 0%, #fceef0 100%)',
      completedBorder: '#ebe4ed',
      completedIconBg: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      completedText: '#7c6b8a',
      completedTextMuted: '#a08eb0',
      buttonPrimaryBg: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      buttonSecondaryBg: 'rgba(255, 255, 255, 0.8)',
      buttonSecondaryBorder: '#ebe4ed',
      buttonSecondaryText: '#7c6b8a',
      headerText: '#6b5a7a',
      headerTextMuted: '#a08eb0',
    },
  },

  // 다크 테마 (순수 검정/회색 + 시안 악센트)
  // 팔레트: zinc 계열 + cyan 악센트
  dark: {
    layout: {
      pageBg: '#09090b',                    // zinc-950
      topBarBg: 'linear-gradient(to right, rgba(24,24,27,0.95), rgba(24,24,27,0.98), rgba(24,24,27,0.95))',
      topBarBorder: 'rgba(39,39,42,0.6)',   // zinc-800
      topBarText: '#fafafa',                // zinc-50
      topBarTextMuted: '#a1a1aa',           // zinc-400
      topBarButtonBg: '#27272a',            // zinc-800
      topBarButtonHover: '#3f3f46',         // zinc-700
      sidebarBg: '#0f0f10',                 // 약간 밝은 검정
      sidebarBorder: '#27272a',             // zinc-800
      sidebarText: '#fafafa',               // zinc-50
      sidebarTextMuted: '#a1a1aa',          // zinc-400
      sidebarItemBg: '#0f0f10',
      sidebarItemActive: '#22d3ee',         // cyan-400
      sidebarItemHover: '#18181b',          // zinc-900
      footerBg: '#0f0f10',
      footerBorder: '#27272a',
      footerText: '#fafafa',
      footerTextMuted: '#71717a',           // zinc-500
      footerLinkHover: '#22d3ee',           // cyan-400
      footerSocialBg: '#27272a',
      footerSocialHover: '#06b6d4',         // cyan-500
    },
    explanation: {
      bgGradient: 'linear-gradient(135deg, #18181b 0%, #1c1c1f 100%)',
      headerGradient: 'linear-gradient(90deg, #27272a 0%, #1f1f22 100%)',
      headerBorder: '#3f3f46',
      text: '#e4e4e7',                      // zinc-200
      textMuted: '#a1a1aa',                 // zinc-400
      buttonBg: 'rgba(39, 39, 42, 0.9)',
      buttonBorder: '#3f3f46',
      buttonText: '#22d3ee',                // cyan-400
      buttonHover: '#3f3f46',
      counterBg: 'rgba(39, 39, 42, 0.9)',
      quizGradient: 'linear-gradient(to right, #0891b2, #06b6d4)',  // cyan-600 → cyan-500
      quizHoverGradient: 'linear-gradient(to right, #0e7490, #0891b2)',
      quizText: '#ffffff',
    },
    memory: {
      stackBg: '#18181b',                   // zinc-900
      stackLabel: '#f472b6',                // pink-400
      stackBorder: '#db2777',               // pink-600
      heapBg: '#141614',                    // 약간 녹색 틴트
      heapLabel: '#4ade80',                 // green-400
      heapBorder: '#16a34a',                // green-600
      dataBg: '#17141d',                    // 약간 보라 틴트
      dataLabel: '#a78bfa',                 // violet-400
      textBg: '#141719',                    // 약간 시안 틴트
      textLabel: '#22d3ee',                 // cyan-400
      cardBg: '#27272a',                    // zinc-800
      cardText: '#fafafa',                  // zinc-50
      cardMuted: '#a1a1aa',                 // zinc-400
      sectionText: '#d4d4d8',               // zinc-300
    },
    dashboard: {
      pageBg: '#09090b',
      cardBg: '#18181b',                    // zinc-900
      cardBorder: '#27272a',                // zinc-800
      title: '#fafafa',
      text: '#e4e4e7',
      textMuted: '#a1a1aa',
      accent: '#22d3ee',                    // cyan-400
      accentHover: '#06b6d4',               // cyan-500
      sectionHeaderBg: '#18181b',
      statCardBg: '#1c1c1f',
      progressBg: '#27272a',
      emptyBg: '#18181b',
    },
    lesson: {
      pageBg: '#09090b',
      panelBg: '#18181b',
      panelBorder: '#27272a',
      codeHeaderBg: 'linear-gradient(135deg, #1c1c1f 0%, #0f0f10 100%)',
      codeHeaderText: '#e4e4e7',
      codeBg: '#141416',
      terminalBorder: '#27272a',
      tabActiveBg: 'linear-gradient(135deg, #1a2a2e 0%, #18181b 100%)',
      tabActiveText: '#22d3ee',
      tabInactiveBg: '#18181b',
      tabInactiveText: '#71717a',
      memoryBg: 'linear-gradient(135deg, #141614 0%, #18181b 100%)',
      chatBg: 'linear-gradient(135deg, #1c1c1f 0%, #18181b 100%)',
      completedBg: 'linear-gradient(135deg, #1a2a2e 0%, #18181b 100%)',
      completedBorder: '#27272a',
      completedIconBg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      completedText: '#fafafa',
      completedTextMuted: '#a1a1aa',
      buttonPrimaryBg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      buttonSecondaryBg: 'rgba(39, 39, 42, 0.9)',
      buttonSecondaryBorder: '#3f3f46',
      buttonSecondaryText: '#e4e4e7',
      headerText: '#fafafa',
      headerTextMuted: '#a1a1aa',
    },
  },

  // 미니멀 테마 (브라운-베이지)
  minimal: {
    layout: {
      pageBg: '#faf9f7',
      topBarBg: 'linear-gradient(to right, rgba(250,249,247,0.8), rgba(250,249,247,0.95), rgba(250,249,247,0.8))',
      topBarBorder: 'rgba(214,208,199,0.5)',
      topBarText: '#5c534a',
      topBarTextMuted: '#8a8279',
      topBarButtonBg: '#f5f3f0',
      topBarButtonHover: '#ebe8e3',
      sidebarBg: '#fffbf5',
      sidebarBorder: '#e5d5c7',
      sidebarText: '#6b5a4a',
      sidebarTextMuted: '#937b5d',
      sidebarItemBg: '#fffbf5',
      sidebarItemActive: '#a08060',
      sidebarItemHover: '#fff8f0',
      footerBg: '#f8f4ef',
      footerBorder: '#e5d5c7',
      footerText: '#6b5a4a',
      footerTextMuted: '#937b5d',
      footerLinkHover: '#a08060',
      footerSocialBg: '#e5d5c7',
      footerSocialHover: '#a08060',
    },
    explanation: {
      bgGradient: 'linear-gradient(135deg, #faf9f7 0%, #f5f3f0 100%)',
      headerGradient: 'linear-gradient(90deg, #ebe8e3 0%, #e8e4de 100%)',
      headerBorder: '#d6d0c7',
      text: '#5c534a',
      textMuted: '#8a8279',
      buttonBg: 'rgba(255,255,255,0.9)',
      buttonBorder: '#c9c2b8',
      buttonText: '#78716c',
      buttonHover: '#f5f5f4',
      counterBg: 'rgba(255,255,255,0.9)',
      quizGradient: 'linear-gradient(to right, #d6d3d1, #a8a29e)',
      quizHoverGradient: 'linear-gradient(to right, #a8a29e, #78716c)',
      quizText: '#44403c',
    },
    memory: {
      stackBg: '#faf8f6',
      stackLabel: '#a1887f',
      stackBorder: '#8d6e63',
      heapBg: '#f5f2ee',
      heapLabel: '#7cb342',
      heapBorder: '#9ccc65',
      dataBg: '#f0ede8',
      dataLabel: '#8d6e63',
      textBg: '#ebe8e3',
      textLabel: '#78909c',
      cardBg: '#fffffe',
      cardText: '#4a4a4a',
      cardMuted: '#8a8279',
      sectionText: '#5c534a',
    },
    dashboard: {
      pageBg: '#faf9f7',
      cardBg: '#fffffe',
      cardBorder: '#d6d0c7',
      title: '#5c534a',
      text: '#6b5a4a',
      textMuted: '#8a8279',
      accent: '#a08060',
      accentHover: '#8b6d4f',
      sectionHeaderBg: '#f0ede8',
      statCardBg: '#f5f3f0',
      progressBg: '#e5e0d8',
      emptyBg: '#faf8f5',
    },
    lesson: {
      pageBg: '#faf9f7',
      panelBg: '#fffffe',
      panelBorder: '#d6d0c7',
      codeHeaderBg: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
      codeHeaderText: '#e5e5e5',
      codeBg: '#fffffe',
      terminalBorder: '#d6d0c7',
      tabActiveBg: 'linear-gradient(135deg, #f0ede8 0%, #e8e4de 100%)',
      tabActiveText: '#5c534a',
      tabInactiveBg: '#faf9f7',
      tabInactiveText: '#8a8279',
      memoryBg: 'linear-gradient(135deg, #f5f2ee 0%, #f0ede8 100%)',
      chatBg: 'linear-gradient(135deg, #faf9f7 0%, #f5f3f0 100%)',
      completedBg: 'linear-gradient(135deg, #f0ede8 0%, #e8e4de 100%)',
      completedBorder: '#d6d0c7',
      completedIconBg: 'linear-gradient(135deg, #a08060 0%, #8b6d4f 100%)',
      completedText: '#5c534a',
      completedTextMuted: '#8a8279',
      buttonPrimaryBg: 'linear-gradient(135deg, #a08060 0%, #8b6d4f 100%)',
      buttonSecondaryBg: 'rgba(255, 255, 254, 0.9)',
      buttonSecondaryBorder: '#d6d0c7',
      buttonSecondaryText: '#5c534a',
      headerText: '#5c534a',
      headerTextMuted: '#8a8279',
    },
  },
};

export const themeLabels: Record<ThemeType, string> = {
  soft: '소프트',
  dark: '다크',
  minimal: '미니멀',
};
