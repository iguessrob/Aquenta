(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');

  function getApi() {
    if (!window.AquentaApiClient) {
      throw new Error('API client is not loaded. Please include script/api-client.js');
    }
    return window.AquentaApiClient;
  }

  function openSidebar() {
    if (!sidebar || !mobileOverlay) return;
    sidebar.classList.add('open');
    mobileOverlay.classList.add('active');
  }

  function closeSidebar() {
    if (!sidebar || !mobileOverlay) return;
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
  }

  function bindSidebar() {
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        if (window.innerWidth < 1024) closeSidebar();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) closeSidebar();
    });
  }

  function bindCardActions() {
    const cardArrearSummary = document.getElementById('cardArrearSummary');
    const cardAgingReceivables = document.getElementById('cardAgingReceivables');
    const cardDisconnectionList = document.getElementById('cardDisconnectionList');
    const cardTotalConsumption = document.getElementById('cardTotalConsumption');

    if (cardTotalConsumption) {
      cardTotalConsumption.addEventListener('click', () => {
        window.location.href = 'total-consumption-report';
      });
    }

    if (cardArrearSummary) {
      cardArrearSummary.addEventListener('click', () => {
        window.location.href = 'arrear-summary';
      });
    }

    if (cardAgingReceivables) {
      cardAgingReceivables.addEventListener('click', () => {
        window.location.href = 'aging-receivables';
      });
    }

    if (cardDisconnectionList) {
      cardDisconnectionList.addEventListener('click', () => {
        window.location.href = 'disconnection-list';
      });
    }
  }

  async function init() {
    bindSidebar();
    bindCardActions();
  }

  init();
})();
