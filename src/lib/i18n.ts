export const SUPPORTED_LOCALES = ["en", "ko", "ja"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: Locale = "ko";

export type Messages = {
  languageName: string;
  common: {
    dashboard: string;
    users: string;
    projects: string;
    careers: string;
    monitoring: string;
    logout: string;
    account: string;
    signedInAs: string;
    language: string;
    theme: string;
    settings: string;
    help: string;
    search: string;
    notifications: string;
    noNotifications: string;
    viewMonitoring: string;
  };
  login: {
    title: string;
    description: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    signIn: string;
    signingIn: string;
    invalidCredentials: string;
    quote: string;
  };
  adminDashboard: {
    title: string;
    description: string;
    manageUsers: string;
    cards: {
      totalUsers: string;
      adminUsers: string;
      standardUsers: string;
      latestSignup: string;
    };
    recentUsersTitle: string;
    emptyUsers: string;
  };
  usersPage: {
    title: string;
    createUser: string;
    createTitle: string;
    editTitle: string;
    detailTitle: string;
  };
  projectsPage: {
    title: string;
    createProject: string;
  };
  careersPage: {
    title: string;
    createCareer: string;
    createTitle: string;
    editTitle: string;
  };
  monitoringPage: {
    title: string;
    description: string;
    grafana: string;
    lastUpdated: string;
    unavailable: string;
    unavailableDescription: string;
    overallStatus: string;
    activeAlerts: string;
    alertsDescription: string;
    noAlerts: string;
    healthy: string;
    warning: string;
    critical: string;
    unknown: string;
    cards: {
      availability: string;
      errorRate: string;
      p95Latency: string;
      p99Latency: string;
      cpuUsage: string;
      memoryUsage: string;
      queueBacklog: string;
      restarts: string;
    };
    alertsTable: {
      alert: string;
      severity: string;
      instance: string;
      value: string;
    };
  };
  projectsManager: {
    projectsList: string;
    slug: string;
    title: string;
    titleKo: string;
    titleEn: string;
    titleJa: string;
    company: string;
    companyKo: string;
    companyEn: string;
    companyJa: string;
    projectRole: string;
    roleKo: string;
    roleEn: string;
    roleJa: string;
    achievements: string;
    achievementsKo: string;
    achievementsEn: string;
    achievementsJa: string;
    technologies: string;
    displayOrder: string;
    startDate: string;
    endDate: string;
    isOngoing: string;
    isPublished: string;
    links: string;
    name: string;
    description: string;
    repositoryUrl: string;
    serviceUrl: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    action: string;
    nameFilterPlaceholder: string;
    applyFilter: string;
    resetFilter: string;
    loading: string;
    loadError: string;
    emptyProjects: string;
    create: string;
    cancel: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    repositoryUrlPlaceholder: string;
    serviceUrlPlaceholder: string;
    statusDraft: string;
    statusPublished: string;
    statusArchived: string;
    statusAll: string;
    toggleStatus: string;
    edit: string;
    delete: string;
    save: string;
    createSuccess: string;
    createError: string;
    updateSuccess: string;
    updateError: string;
    deleteSuccess: string;
    deleteError: string;
    slugPlaceholder: string;
    titlePlaceholder: string;
    companyPlaceholder: string;
    rolePlaceholder: string;
    achievementsPlaceholder: string;
    technologiesPlaceholder: string;
    linksPlaceholder: string;
    displayOrderPlaceholder: string;
    startDatePlaceholder: string;
    endDatePlaceholder: string;
    publishedOnly: string;
    unpublishedOnly: string;
  };
  careersManager: {
    careersList: string;
    company: string;
    companyKo: string;
    companyEn: string;
    companyJa: string;
    position: string;
    positionKo: string;
    positionEn: string;
    positionJa: string;
    description: string;
    descriptionKo: string;
    descriptionEn: string;
    descriptionJa: string;
    startDate: string;
    endDate: string;
    isCurrent: string;
    isPublished: string;
    displayOrder: string;
    createdAt: string;
    updatedAt: string;
    action: string;
    companyFilterPlaceholder: string;
    positionFilterPlaceholder: string;
    applyFilter: string;
    resetFilter: string;
    emptyCareers: string;
    loadError: string;
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    backToList: string;
    companyPlaceholder: string;
    positionPlaceholder: string;
    descriptionPlaceholder: string;
    createSuccess: string;
    createError: string;
    updateSuccess: string;
    updateError: string;
    deleteSuccess: string;
    deleteError: string;
    allStatus: string;
    currentOnly: string;
    notCurrentOnly: string;
    publishedOnly: string;
    unpublishedOnly: string;
  };
  usersManager: {
    username: string;
    email: string;
    name: string;
    usernameFilterPlaceholder: string;
    nameFilterPlaceholder: string;
    applyFilter: string;
    resetFilter: string;
    password: string;
    passwordPlaceholder: string;
    usernamePlaceholder: string;
    emailPlaceholder: string;
    namePlaceholder: string;
    role: string;
    roleAdmin: string;
    roleUser: string;
    create: string;
    usersList: string;
    loading: string;
    loadError: string;
    emptyUsers: string;
    createdAt: string;
    updatedAt: string;
    loginStatus: string;
    online: string;
    offline: string;
    action: string;
    edit: string;
    details: string;
    forceLogout: string;
    forceLogoutConfirm: string;
    forceLogoutError: string;
    sessions: string;
    sessionId: string;
    sessionIssuedAt: string;
    sessionLastSeenAt: string;
    sessionLastIp: string;
    sessionUserAgent: string;
    sessionNoIp: string;
    sessionNoUserAgent: string;
    sessionLoadError: string;
    sessionEmpty: string;
    revokeSession: string;
    revokeSessionConfirm: string;
    revokeAllSessions: string;
    revokeAllSessionsConfirm: string;
    backToList: string;
    createError: string;
    createErrorUsernameExists: string;
    createErrorEmailExists: string;
    createErrorMailSync: string;
    createSuccess: string;
    updateSuccess: string;
    updateError: string;
    deleteSuccess: string;
    deleteError: string;
    forceLogoutSuccess: string;
    revokeSessionSuccess: string;
    revokeAllSessionsSuccess: string;
    delete: string;
    save: string;
    deleteConfirm: string;
    deleteConfirmFinal: string;
    cancel: string;
  };
};

const messages: Record<Locale, Messages> = {
  en: {
    languageName: "English",
    common: {
      dashboard: "Dashboard",
      users: "Users",
      projects: "Portfolio",
      careers: "Career",
      monitoring: "Monitoring",
      logout: "Logout",
      account: "Account",
      signedInAs: "Signed in as",
      language: "Language",
      theme: "Theme",
      settings: "Settings",
      help: "Help",
      search: "Search",
      notifications: "Notifications",
      noNotifications: "No notifications.",
      viewMonitoring: "Open monitoring",
    },
    login: {
      title: "Sign in",
      description: "Enter your credentials to access the admin console.",
      usernameLabel: "ID or Email",
      usernamePlaceholder: "Enter your ID or email",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      signIn: "Sign in",
      signingIn: "Signing in...",
      invalidCredentials: "Invalid ID/email or password.",
      quote: "Manage portfolio services and permissions from one console.",
    },
    adminDashboard: {
      title: "Admin Dashboard",
      description: "Monitor project operations and manage permissions.",
      manageUsers: "Manage users",
      cards: {
        totalUsers: "Total users",
        adminUsers: "Administrators",
        standardUsers: "Standard users",
        latestSignup: "Latest signup",
      },
      recentUsersTitle: "Recent users",
      emptyUsers: "No users found.",
    },
    usersPage: {
      title: "User Management",
      createUser: "Create user",
      createTitle: "Create User",
      editTitle: "Edit User",
      detailTitle: "User Sessions",
    },
    projectsPage: {
      title: "Portfolio Management",
      createProject: "Create portfolio",
    },
    careersPage: {
      title: "Career Management",
      createCareer: "Create career",
      createTitle: "Create Career",
      editTitle: "Edit Career",
    },
    monitoringPage: {
      title: "System Monitoring",
      description: "Track service health and jump to Grafana for detailed analysis.",
      grafana: "Open Grafana",
      lastUpdated: "Last updated",
      unavailable: "Monitoring is not configured.",
      unavailableDescription:
        "Set PROMETHEUS_BASE_URL to enable metrics collection in admin.",
      overallStatus: "Overall status",
      activeAlerts: "Active alerts",
      alertsDescription: "Alerts currently firing from Prometheus.",
      noAlerts: "No active alerts.",
      healthy: "Healthy",
      warning: "Warning",
      critical: "Critical",
      unknown: "Unknown",
      cards: {
        availability: "Availability",
        errorRate: "5xx error rate",
        p95Latency: "P95 latency",
        p99Latency: "P99 latency",
        cpuUsage: "CPU usage",
        memoryUsage: "Memory usage",
        queueBacklog: "Queue backlog",
        restarts: "Restarts (30m)",
      },
      alertsTable: {
        alert: "Alert",
        severity: "Severity",
        instance: "Instance",
        value: "Value",
      },
    },
    usersManager: {
      username: "ID",
      email: "Email",
      name: "Name",
      usernameFilterPlaceholder: "Filter by ID",
      nameFilterPlaceholder: "Filter by name",
      applyFilter: "Apply",
      resetFilter: "Reset",
      password: "Password",
      passwordPlaceholder: "Enter a password",
      usernamePlaceholder: "Enter an ID",
      emailPlaceholder: "Enter an email address",
      namePlaceholder: "Enter a display name",
      role: "Role",
      roleAdmin: "Admin",
      roleUser: "User",
      create: "Create",
      usersList: "Users",
      loading: "Loading...",
      loadError: "Failed to load users.",
      emptyUsers: "No users found.",
      createdAt: "Created at",
      updatedAt: "Updated at",
      loginStatus: "Login status",
      online: "Online",
      offline: "Offline",
      action: "Action",
      edit: "Edit",
      details: "Details",
      forceLogout: "Force logout",
      forceLogoutConfirm: "Force logout this user's active sessions?",
      forceLogoutError: "Failed to force logout user sessions.",
      sessions: "Active sessions",
      sessionId: "Session ID",
      sessionIssuedAt: "Issued at",
      sessionLastSeenAt: "Last seen",
      sessionLastIp: "Last IP",
      sessionUserAgent: "User agent",
      sessionNoIp: "Unknown IP",
      sessionNoUserAgent: "Unknown agent",
      sessionLoadError: "Failed to load sessions.",
      sessionEmpty: "No active sessions.",
      revokeSession: "Revoke session",
      revokeSessionConfirm: "Revoke this session?",
      revokeAllSessions: "Revoke all sessions",
      revokeAllSessionsConfirm: "Revoke all active sessions for this user?",
      backToList: "List",
      createError: "Failed to create user.",
      createErrorUsernameExists: "ID already exists.",
      createErrorEmailExists: "Email already exists.",
      createErrorMailSync: "Mail sync failed. User was not created.",
      createSuccess: "User created successfully.",
      updateSuccess: "User updated successfully.",
      updateError: "Failed to update user.",
      deleteSuccess: "User deleted successfully.",
      deleteError: "Failed to delete user.",
      forceLogoutSuccess: "User sessions were logged out.",
      revokeSessionSuccess: "Session revoked.",
      revokeAllSessionsSuccess: "All sessions revoked.",
      delete: "Delete",
      save: "Save",
      deleteConfirm: "Delete this user?",
      deleteConfirmFinal: "This action cannot be undone. Delete user now?",
      cancel: "Cancel",
    },
    projectsManager: {
      projectsList: "Portfolios",
      slug: "Slug",
      title: "Title",
      titleKo: "Title (KO)",
      titleEn: "Title (EN)",
      titleJa: "Title (JA)",
      company: "Company",
      companyKo: "Company (KO)",
      companyEn: "Company (EN)",
      companyJa: "Company (JA)",
      projectRole: "Role",
      roleKo: "Role (KO)",
      roleEn: "Role (EN)",
      roleJa: "Role (JA)",
      achievements: "Achievements",
      achievementsKo: "Achievements (KO, JSON array)",
      achievementsEn: "Achievements (EN, JSON array)",
      achievementsJa: "Achievements (JA, JSON array)",
      technologies: "Technologies",
      displayOrder: "Display order",
      startDate: "Start date",
      endDate: "End date",
      isOngoing: "Ongoing",
      isPublished: "Published",
      links: "Links (JSON)",
      name: "Name",
      description: "Description",
      repositoryUrl: "Repository URL",
      serviceUrl: "Service URL",
      status: "Status",
      createdAt: "Created at",
      updatedAt: "Updated at",
      action: "Action",
      nameFilterPlaceholder: "Filter by portfolio name",
      applyFilter: "Apply",
      resetFilter: "Reset",
      loading: "Loading...",
      loadError: "Failed to load portfolios.",
      emptyProjects: "No portfolios found.",
      create: "Create",
      cancel: "Cancel",
      namePlaceholder: "Enter a portfolio name",
      descriptionPlaceholder: "Enter a short portfolio description",
      repositoryUrlPlaceholder: "https://github.com/your/repository",
      serviceUrlPlaceholder: "https://your-service-url.com",
      statusDraft: "Draft",
      statusPublished: "Published",
      statusArchived: "Archived",
      statusAll: "All statuses",
      toggleStatus: "Change status",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      createSuccess: "Portfolio created successfully.",
      createError: "Failed to create portfolio.",
      updateSuccess: "Portfolio updated successfully.",
      updateError: "Failed to update portfolio.",
      deleteSuccess: "Portfolio deleted successfully.",
      deleteError: "Failed to delete portfolio.",
      slugPlaceholder: "Enter a unique slug",
      titlePlaceholder: "Enter a title",
      companyPlaceholder: "Enter a company",
      rolePlaceholder: "Enter a role",
      achievementsPlaceholder: "[\"Achievement 1\", \"Achievement 2\"]",
      technologiesPlaceholder: "React, Next.js, PostgreSQL",
      linksPlaceholder: "{\"github\":\"https://github.com/...\"}",
      displayOrderPlaceholder: "0",
      startDatePlaceholder: "2025-01-01",
      endDatePlaceholder: "2025-12-31",
      publishedOnly: "Published only",
      unpublishedOnly: "Unpublished only",
    },
    careersManager: {
      careersList: "Career entries",
      company: "Company",
      companyKo: "Company (KO)",
      companyEn: "Company (EN)",
      companyJa: "Company (JA)",
      position: "Position",
      positionKo: "Position (KO)",
      positionEn: "Position (EN)",
      positionJa: "Position (JA)",
      description: "Description",
      descriptionKo: "Description (KO)",
      descriptionEn: "Description (EN)",
      descriptionJa: "Description (JA)",
      startDate: "Start date",
      endDate: "End date",
      isCurrent: "Current",
      isPublished: "Published",
      displayOrder: "Display order",
      createdAt: "Created at",
      updatedAt: "Updated at",
      action: "Action",
      companyFilterPlaceholder: "Filter by company",
      positionFilterPlaceholder: "Filter by position",
      applyFilter: "Apply",
      resetFilter: "Reset",
      emptyCareers: "No career entries found.",
      loadError: "Failed to load careers.",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      backToList: "List",
      companyPlaceholder: "Enter company name",
      positionPlaceholder: "Enter position",
      descriptionPlaceholder: "Enter a short description",
      createSuccess: "Career created successfully.",
      createError: "Failed to create career.",
      updateSuccess: "Career updated successfully.",
      updateError: "Failed to update career.",
      deleteSuccess: "Career deleted successfully.",
      deleteError: "Failed to delete career.",
      allStatus: "All",
      currentOnly: "Current only",
      notCurrentOnly: "Not current only",
      publishedOnly: "Published only",
      unpublishedOnly: "Unpublished only",
    },
  },
  ko: {
    languageName: "한국어",
    common: {
      dashboard: "대시보드",
      users: "사용자 관리",
      projects: "포트폴리오 관리",
      careers: "경력 관리",
      monitoring: "시스템 모니터링",
      logout: "로그아웃",
      account: "계정",
      signedInAs: "로그인 사용자",
      language: "언어",
      theme: "테마",
      settings: "설정",
      help: "도움말",
      search: "검색",
      notifications: "알림",
      noNotifications: "표시할 알림이 없습니다.",
      viewMonitoring: "모니터링 열기",
    },
    login: {
      title: "로그인",
      description: "관리자 콘솔에 접속하려면 계정 정보를 입력하세요.",
      usernameLabel: "아이디 또는 이메일",
      usernamePlaceholder: "아이디 또는 이메일을 입력하세요",
      passwordLabel: "비밀번호",
      passwordPlaceholder: "비밀번호를 입력하세요",
      signIn: "로그인",
      signingIn: "로그인 중...",
      invalidCredentials: "아이디/이메일 또는 비밀번호가 올바르지 않습니다.",
      quote: "포트폴리오 서비스 상태와 사용자 권한을 한 번에 관리하는 운영 대시보드",
    },
    adminDashboard: {
      title: "관리자 대시보드",
      description: "포트폴리오 운영 상태와 권한 관리를 진행할 수 있습니다.",
      manageUsers: "사용자 관리",
      cards: {
        totalUsers: "전체 사용자",
        adminUsers: "관리자 수",
        standardUsers: "일반 사용자",
        latestSignup: "최근 가입",
      },
      recentUsersTitle: "최근 사용자",
      emptyUsers: "사용자가 없습니다.",
    },
    usersPage: {
      title: "사용자 관리",
      createUser: "사용자 생성",
      createTitle: "사용자 생성",
      editTitle: "사용자 수정",
      detailTitle: "사용자 세션",
    },
    projectsPage: {
      title: "포트폴리오 관리",
      createProject: "포트폴리오 생성",
    },
    careersPage: {
      title: "경력 관리",
      createCareer: "경력 추가",
      createTitle: "경력 추가",
      editTitle: "경력 수정",
    },
    monitoringPage: {
      title: "시스템 모니터링",
      description: "핵심 운영 지표를 확인하고 상세 분석은 Grafana로 이동합니다.",
      grafana: "Grafana 열기",
      lastUpdated: "마지막 갱신",
      unavailable: "모니터링 구성이 필요합니다.",
      unavailableDescription:
        "관리자에서 메트릭을 수집하려면 PROMETHEUS_BASE_URL을 설정하세요.",
      overallStatus: "전체 상태",
      activeAlerts: "활성 알림",
      alertsDescription: "현재 Prometheus에서 발생 중인 알림입니다.",
      noAlerts: "활성 알림이 없습니다.",
      healthy: "정상",
      warning: "주의",
      critical: "위험",
      unknown: "확인 불가",
      cards: {
        availability: "가용성",
        errorRate: "5xx 오류율",
        p95Latency: "P95 응답시간",
        p99Latency: "P99 응답시간",
        cpuUsage: "CPU 사용률",
        memoryUsage: "메모리 사용률",
        queueBacklog: "큐 적체",
        restarts: "재시작 (30분)",
      },
      alertsTable: {
        alert: "알림명",
        severity: "심각도",
        instance: "인스턴스",
        value: "값",
      },
    },
    usersManager: {
      username: "아이디",
      email: "이메일",
      name: "이름",
      usernameFilterPlaceholder: "아이디로 검색",
      nameFilterPlaceholder: "이름으로 검색",
      applyFilter: "필터 적용",
      resetFilter: "초기화",
      password: "비밀번호",
      passwordPlaceholder: "비밀번호를 입력하세요",
      usernamePlaceholder: "아이디를 입력하세요",
      emailPlaceholder: "이메일을 입력하세요",
      namePlaceholder: "이름을 입력하세요",
      role: "권한",
      roleAdmin: "관리자",
      roleUser: "사용자",
      create: "생성",
      usersList: "사용자 목록",
      loading: "불러오는 중...",
      loadError: "사용자 목록 조회에 실패했습니다.",
      emptyUsers: "사용자가 없습니다.",
      createdAt: "생성일",
      updatedAt: "수정일",
      loginStatus: "로그인 상태",
      online: "로그인됨",
      offline: "로그아웃됨",
      action: "작업",
      edit: "수정",
      details: "상세",
      forceLogout: "강제 로그아웃",
      forceLogoutConfirm: "이 사용자의 활성 세션을 강제 로그아웃할까요?",
      forceLogoutError: "강제 로그아웃 처리에 실패했습니다.",
      sessions: "활성 세션",
      sessionId: "세션 ID",
      sessionIssuedAt: "발급 시각",
      sessionLastSeenAt: "마지막 활동",
      sessionLastIp: "마지막 IP",
      sessionUserAgent: "사용자 에이전트",
      sessionNoIp: "알 수 없음",
      sessionNoUserAgent: "알 수 없음",
      sessionLoadError: "세션 목록 조회에 실패했습니다.",
      sessionEmpty: "활성 세션이 없습니다.",
      revokeSession: "세션 종료",
      revokeSessionConfirm: "이 세션을 종료할까요?",
      revokeAllSessions: "전체 세션 종료",
      revokeAllSessionsConfirm: "이 사용자의 모든 활성 세션을 종료할까요?",
      backToList: "목록",
      createError: "사용자 생성에 실패했습니다.",
      createErrorUsernameExists: "이미 사용 중인 아이디입니다.",
      createErrorEmailExists: "이미 사용 중인 이메일입니다.",
      createErrorMailSync: "메일 동기화에 실패하여 사용자가 생성되지 않았습니다.",
      createSuccess: "사용자가 생성되었습니다.",
      updateSuccess: "사용자 정보가 수정되었습니다.",
      updateError: "사용자 수정에 실패했습니다.",
      deleteSuccess: "사용자가 삭제되었습니다.",
      deleteError: "사용자 삭제에 실패했습니다.",
      forceLogoutSuccess: "사용자 세션을 강제 로그아웃했습니다.",
      revokeSessionSuccess: "세션을 종료했습니다.",
      revokeAllSessionsSuccess: "모든 세션을 종료했습니다.",
      delete: "삭제",
      save: "저장",
      deleteConfirm: "이 사용자를 삭제하시겠습니까?",
      deleteConfirmFinal: "삭제 후 복구할 수 없습니다. 정말 삭제할까요?",
      cancel: "취소",
    },
    projectsManager: {
      projectsList: "포트폴리오 목록",
      slug: "슬러그",
      title: "제목",
      titleKo: "제목 (KO)",
      titleEn: "제목 (EN)",
      titleJa: "제목 (JA)",
      company: "회사",
      companyKo: "회사 (KO)",
      companyEn: "회사 (EN)",
      companyJa: "회사 (JA)",
      projectRole: "역할",
      roleKo: "역할 (KO)",
      roleEn: "역할 (EN)",
      roleJa: "역할 (JA)",
      achievements: "성과",
      achievementsKo: "성과 (KO, JSON 배열)",
      achievementsEn: "성과 (EN, JSON 배열)",
      achievementsJa: "성과 (JA, JSON 배열)",
      technologies: "기술 스택",
      displayOrder: "정렬 순서",
      startDate: "시작일",
      endDate: "종료일",
      isOngoing: "진행 중",
      isPublished: "공개 여부",
      links: "링크(JSON)",
      name: "포트폴리오명",
      description: "설명",
      repositoryUrl: "저장소 URL",
      serviceUrl: "서비스 URL",
      status: "상태",
      createdAt: "생성일",
      updatedAt: "수정일",
      action: "작업",
      nameFilterPlaceholder: "포트폴리오명으로 검색",
      applyFilter: "필터 적용",
      resetFilter: "초기화",
      loading: "불러오는 중...",
      loadError: "포트폴리오 목록 조회에 실패했습니다.",
      emptyProjects: "포트폴리오가 없습니다.",
      create: "생성",
      cancel: "취소",
      namePlaceholder: "포트폴리오명을 입력하세요",
      descriptionPlaceholder: "포트폴리오 설명을 입력하세요",
      repositoryUrlPlaceholder: "https://github.com/your/repository",
      serviceUrlPlaceholder: "https://your-service-url.com",
      statusDraft: "초안",
      statusPublished: "공개",
      statusArchived: "보관",
      statusAll: "전체 상태",
      toggleStatus: "상태 변경",
      edit: "수정",
      delete: "삭제",
      save: "저장",
      createSuccess: "포트폴리오가 생성되었습니다.",
      createError: "포트폴리오 생성에 실패했습니다.",
      updateSuccess: "포트폴리오가 수정되었습니다.",
      updateError: "포트폴리오 수정에 실패했습니다.",
      deleteSuccess: "포트폴리오가 삭제되었습니다.",
      deleteError: "포트폴리오 삭제에 실패했습니다.",
      slugPlaceholder: "고유 슬러그를 입력하세요",
      titlePlaceholder: "제목을 입력하세요",
      companyPlaceholder: "회사를 입력하세요",
      rolePlaceholder: "역할을 입력하세요",
      achievementsPlaceholder: "[\"성과 1\", \"성과 2\"]",
      technologiesPlaceholder: "React, Next.js, PostgreSQL",
      linksPlaceholder: "{\"github\":\"https://github.com/...\"}",
      displayOrderPlaceholder: "0",
      startDatePlaceholder: "2025-01-01",
      endDatePlaceholder: "2025-12-31",
      publishedOnly: "공개만",
      unpublishedOnly: "비공개만",
    },
    careersManager: {
      careersList: "경력 목록",
      company: "회사",
      companyKo: "회사 (KO)",
      companyEn: "회사 (EN)",
      companyJa: "회사 (JA)",
      position: "직책",
      positionKo: "직책 (KO)",
      positionEn: "직책 (EN)",
      positionJa: "직책 (JA)",
      description: "설명",
      descriptionKo: "설명 (KO)",
      descriptionEn: "설명 (EN)",
      descriptionJa: "설명 (JA)",
      startDate: "시작일",
      endDate: "종료일",
      isCurrent: "재직 중",
      isPublished: "공개 여부",
      displayOrder: "정렬 순서",
      createdAt: "생성일",
      updatedAt: "수정일",
      action: "작업",
      companyFilterPlaceholder: "회사명으로 검색",
      positionFilterPlaceholder: "직책으로 검색",
      applyFilter: "필터 적용",
      resetFilter: "초기화",
      emptyCareers: "경력 데이터가 없습니다.",
      loadError: "경력 목록 조회에 실패했습니다.",
      create: "생성",
      edit: "수정",
      delete: "삭제",
      save: "저장",
      cancel: "취소",
      backToList: "목록",
      companyPlaceholder: "회사명을 입력하세요",
      positionPlaceholder: "직책을 입력하세요",
      descriptionPlaceholder: "간단한 설명을 입력하세요",
      createSuccess: "경력이 추가되었습니다.",
      createError: "경력 추가에 실패했습니다.",
      updateSuccess: "경력이 수정되었습니다.",
      updateError: "경력 수정에 실패했습니다.",
      deleteSuccess: "경력이 삭제되었습니다.",
      deleteError: "경력 삭제에 실패했습니다.",
      allStatus: "전체",
      currentOnly: "재직 중만",
      notCurrentOnly: "퇴사 포함",
      publishedOnly: "공개만",
      unpublishedOnly: "비공개만",
    },
  },
  ja: {
    languageName: "日本語",
    common: {
      dashboard: "ダッシュボード",
      users: "ユーザー管理",
      projects: "ポートフォリオ管理",
      careers: "経歴管理",
      monitoring: "システム監視",
      logout: "ログアウト",
      account: "アカウント",
      signedInAs: "ログインユーザー",
      language: "言語",
      theme: "テーマ",
      settings: "設定",
      help: "ヘルプ",
      search: "検索",
      notifications: "通知",
      noNotifications: "通知はありません。",
      viewMonitoring: "監視を開く",
    },
    login: {
      title: "ログイン",
      description: "管理コンソールにアクセスするため認証情報を入力してください。",
      usernameLabel: "ID またはメール",
      usernamePlaceholder: "ID を入力してください",
      passwordLabel: "パスワード",
      passwordPlaceholder: "パスワードを入力してください",
      signIn: "ログイン",
      signingIn: "ログイン中...",
      invalidCredentials: "ID/メールまたはパスワードが正しくありません。",
      quote: "ポートフォリオサービス状態と権限を一つのコンソールで管理します。",
    },
    adminDashboard: {
      title: "管理者ダッシュボード",
      description: "ポートフォリオ運用状況の監視と権限管理を行えます。",
      manageUsers: "ユーザー管理",
      cards: {
        totalUsers: "総ユーザー数",
        adminUsers: "管理者",
        standardUsers: "一般ユーザー",
        latestSignup: "最新登録",
      },
      recentUsersTitle: "最近のユーザー",
      emptyUsers: "ユーザーがいません。",
    },
    usersPage: {
      title: "ユーザー管理",
      createUser: "ユーザー作成",
      createTitle: "ユーザー作成",
      editTitle: "ユーザー編集",
      detailTitle: "ユーザーセッション",
    },
    projectsPage: {
      title: "ポートフォリオ管理",
      createProject: "ポートフォリオ作成",
    },
    careersPage: {
      title: "経歴管理",
      createCareer: "経歴作成",
      createTitle: "経歴作成",
      editTitle: "経歴編集",
    },
    monitoringPage: {
      title: "システム監視",
      description: "主要メトリクスを確認し、詳細は Grafana で分析します。",
      grafana: "Grafana を開く",
      lastUpdated: "最終更新",
      unavailable: "監視設定が必要です。",
      unavailableDescription:
        "管理画面でメトリクス収集を有効にするには PROMETHEUS_BASE_URL を設定してください。",
      overallStatus: "全体ステータス",
      activeAlerts: "有効アラート",
      alertsDescription: "現在 Prometheus で発火中のアラートです。",
      noAlerts: "有効なアラートはありません。",
      healthy: "正常",
      warning: "注意",
      critical: "危険",
      unknown: "不明",
      cards: {
        availability: "可用性",
        errorRate: "5xx エラー率",
        p95Latency: "P95 レイテンシ",
        p99Latency: "P99 レイテンシ",
        cpuUsage: "CPU 使用率",
        memoryUsage: "メモリ使用率",
        queueBacklog: "キュー滞留",
        restarts: "再起動 (30分)",
      },
      alertsTable: {
        alert: "アラート",
        severity: "重大度",
        instance: "インスタンス",
        value: "値",
      },
    },
    usersManager: {
      username: "ID",
      email: "メール",
      name: "名前",
      usernameFilterPlaceholder: "ID で検索",
      nameFilterPlaceholder: "名前で検索",
      applyFilter: "適用",
      resetFilter: "リセット",
      password: "パスワード",
      passwordPlaceholder: "パスワードを入力してください",
      usernamePlaceholder: "ID またはメールを入力してください",
      emailPlaceholder: "メールアドレスを入力してください",
      namePlaceholder: "表示名を入力してください",
      role: "権限",
      roleAdmin: "管理者",
      roleUser: "ユーザー",
      create: "作成",
      usersList: "ユーザー一覧",
      loading: "読み込み中...",
      loadError: "ユーザー一覧の取得に失敗しました。",
      emptyUsers: "ユーザーがいません。",
      createdAt: "作成日時",
      updatedAt: "更新日時",
      loginStatus: "ログイン状態",
      online: "ログイン中",
      offline: "ログアウト",
      action: "操作",
      edit: "編集",
      details: "詳細",
      forceLogout: "強制ログアウト",
      forceLogoutConfirm: "このユーザーの有効セッションを強制ログアウトしますか？",
      forceLogoutError: "強制ログアウトに失敗しました。",
      sessions: "有効セッション",
      sessionId: "セッション ID",
      sessionIssuedAt: "発行日時",
      sessionLastSeenAt: "最終アクティブ",
      sessionLastIp: "最終 IP",
      sessionUserAgent: "ユーザーエージェント",
      sessionNoIp: "不明",
      sessionNoUserAgent: "不明",
      sessionLoadError: "セッション一覧の取得に失敗しました。",
      sessionEmpty: "有効なセッションがありません。",
      revokeSession: "セッション終了",
      revokeSessionConfirm: "このセッションを終了しますか？",
      revokeAllSessions: "全セッション終了",
      revokeAllSessionsConfirm: "このユーザーの全有効セッションを終了しますか？",
      backToList: "一覧",
      createError: "ユーザー作成に失敗しました。",
      createErrorUsernameExists: "この ID は既に使用されています。",
      createErrorEmailExists: "このメールアドレスは既に使用されています。",
      createErrorMailSync: "メール同期に失敗したため、ユーザーは作成されませんでした。",
      createSuccess: "ユーザーを作成しました。",
      updateSuccess: "ユーザー情報を更新しました。",
      updateError: "ユーザー更新に失敗しました。",
      deleteSuccess: "ユーザーを削除しました。",
      deleteError: "ユーザー削除に失敗しました。",
      forceLogoutSuccess: "ユーザーセッションを強制ログアウトしました。",
      revokeSessionSuccess: "セッションを終了しました。",
      revokeAllSessionsSuccess: "全セッションを終了しました。",
      delete: "削除",
      save: "保存",
      deleteConfirm: "このユーザーを削除しますか？",
      deleteConfirmFinal: "この操作は取り消せません。削除してよろしいですか？",
      cancel: "キャンセル",
    },
    projectsManager: {
      projectsList: "ポートフォリオ一覧",
      slug: "スラッグ",
      title: "タイトル",
      titleKo: "タイトル (KO)",
      titleEn: "タイトル (EN)",
      titleJa: "タイトル (JA)",
      company: "会社",
      companyKo: "会社 (KO)",
      companyEn: "会社 (EN)",
      companyJa: "会社 (JA)",
      projectRole: "役割",
      roleKo: "役割 (KO)",
      roleEn: "役割 (EN)",
      roleJa: "役割 (JA)",
      achievements: "実績",
      achievementsKo: "実績 (KO, JSON 配列)",
      achievementsEn: "実績 (EN, JSON 配列)",
      achievementsJa: "実績 (JA, JSON 配列)",
      technologies: "技術スタック",
      displayOrder: "表示順",
      startDate: "開始日",
      endDate: "終了日",
      isOngoing: "進行中",
      isPublished: "公開",
      links: "リンク(JSON)",
      name: "ポートフォリオ名",
      description: "説明",
      repositoryUrl: "リポジトリ URL",
      serviceUrl: "サービス URL",
      status: "ステータス",
      createdAt: "作成日時",
      updatedAt: "更新日時",
      action: "操作",
      nameFilterPlaceholder: "ポートフォリオ名で検索",
      applyFilter: "適用",
      resetFilter: "リセット",
      loading: "読み込み中...",
      loadError: "ポートフォリオ一覧の取得に失敗しました。",
      emptyProjects: "ポートフォリオがありません。",
      create: "作成",
      cancel: "キャンセル",
      namePlaceholder: "ポートフォリオ名を入力してください",
      descriptionPlaceholder: "ポートフォリオ説明を入力してください",
      repositoryUrlPlaceholder: "https://github.com/your/repository",
      serviceUrlPlaceholder: "https://your-service-url.com",
      statusDraft: "下書き",
      statusPublished: "公開",
      statusArchived: "アーカイブ",
      statusAll: "すべてのステータス",
      toggleStatus: "ステータス変更",
      edit: "編集",
      delete: "削除",
      save: "保存",
      createSuccess: "ポートフォリオを作成しました。",
      createError: "ポートフォリオ作成に失敗しました。",
      updateSuccess: "ポートフォリオを更新しました。",
      updateError: "ポートフォリオ更新に失敗しました。",
      deleteSuccess: "ポートフォリオを削除しました。",
      deleteError: "ポートフォリオ削除に失敗しました。",
      slugPlaceholder: "一意のスラッグを入力してください",
      titlePlaceholder: "タイトルを入力してください",
      companyPlaceholder: "会社名を入力してください",
      rolePlaceholder: "役割を入力してください",
      achievementsPlaceholder: "[\"実績1\", \"実績2\"]",
      technologiesPlaceholder: "React, Next.js, PostgreSQL",
      linksPlaceholder: "{\"github\":\"https://github.com/...\"}",
      displayOrderPlaceholder: "0",
      startDatePlaceholder: "2025-01-01",
      endDatePlaceholder: "2025-12-31",
      publishedOnly: "公開のみ",
      unpublishedOnly: "非公開のみ",
    },
    careersManager: {
      careersList: "経歴一覧",
      company: "会社",
      companyKo: "会社 (KO)",
      companyEn: "会社 (EN)",
      companyJa: "会社 (JA)",
      position: "役職",
      positionKo: "役職 (KO)",
      positionEn: "役職 (EN)",
      positionJa: "役職 (JA)",
      description: "説明",
      descriptionKo: "説明 (KO)",
      descriptionEn: "説明 (EN)",
      descriptionJa: "説明 (JA)",
      startDate: "開始日",
      endDate: "終了日",
      isCurrent: "在職中",
      isPublished: "公開",
      displayOrder: "表示順",
      createdAt: "作成日時",
      updatedAt: "更新日時",
      action: "操作",
      companyFilterPlaceholder: "会社名で検索",
      positionFilterPlaceholder: "役職で検索",
      applyFilter: "適用",
      resetFilter: "リセット",
      emptyCareers: "経歴データがありません。",
      loadError: "経歴一覧の取得に失敗しました。",
      create: "作成",
      edit: "編集",
      delete: "削除",
      save: "保存",
      cancel: "キャンセル",
      backToList: "一覧",
      companyPlaceholder: "会社名を入力してください",
      positionPlaceholder: "役職を入力してください",
      descriptionPlaceholder: "簡単な説明を入力してください",
      createSuccess: "経歴を作成しました。",
      createError: "経歴作成に失敗しました。",
      updateSuccess: "経歴を更新しました。",
      updateError: "経歴更新に失敗しました。",
      deleteSuccess: "経歴を削除しました。",
      deleteError: "経歴削除に失敗しました。",
      allStatus: "すべて",
      currentOnly: "在職中のみ",
      notCurrentOnly: "在職外を含む",
      publishedOnly: "公開のみ",
      unpublishedOnly: "非公開のみ",
    },
  },
};

export function getLocale(value?: string | null): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  return SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export function getMessages(locale: Locale) {
  return messages[locale];
}

export function toLocaleCode(locale: Locale): "ko-KR" | "en-US" | "ja-JP" {
  if (locale === "ja") return "ja-JP";
  if (locale === "en") return "en-US";
  return "ko-KR";
}
