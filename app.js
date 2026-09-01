const app = document.querySelector('#app');
const screens = [...document.querySelectorAll('.screen')];
const navButtons = [...document.querySelectorAll('.bottom-nav [data-screen]')];
const overlay = document.querySelector('#overlay');
const mapCanvas = document.querySelector('#map-canvas');
const mapContext = document.querySelector('#map-context');
const searchInput = document.querySelector('#search-input');
const searchResults = document.querySelector('#search-results');
const toast = document.querySelector('#toast');

const places = [
  { icon: '06', title: 'Павильон №6', meta: 'Павильон · маршрут-демонстрация', action: 'object' },
  { icon: 'БП', title: 'Бюро пропусков', meta: 'Сервис · положение на схеме', action: 'route' },
  { icon: 'АК', title: 'Актёрский комплекс', meta: 'Категория · прототипный объект', action: 'service' },
  { icon: 'Е', title: 'Где поесть', meta: 'Категория · точки требуют проверки', action: 'food' },
  { icon: 'АТ', title: 'Ателье для проб', meta: 'Сервис · прототипная карточка', action: 'auditions' },
];

const services = {
  rooms: { icon: '⌑', kicker: 'ПОМЕЩЕНИЯ', title: 'Найти помещение', copy: 'Подберите пространство по задаче и отправьте запрос ответственному подразделению.', button: 'Подобрать помещение', steps: [['Задача', 'Укажите тип съёмки, даты и состав группы.'], ['Подбор', 'Сервис показывает подходящие варианты на карте.'], ['Запрос', 'Заявка уходит на проверку доступности.']] },
  food: { icon: '◒', kicker: 'НА ТЕРРИТОРИИ', title: 'Где поесть', copy: 'Покажем проверенные точки питания, часы работы и маршрут от текущей позиции.', button: 'Показать на карте', steps: [['Позиция', 'Определяем старт через GPS или QR.'], ['Фильтр', 'Выбираете ближайшую доступную точку.'], ['Маршрут', 'Получаете путь по территории.']] },
  actors: { icon: '◎', kicker: 'НАВИГАЦИЯ', title: 'Актёрские комплексы', copy: 'Поиск комплекса по номеру или названию проекта с построением маршрута.', button: 'Найти комплекс', steps: [['Поиск', 'Введите номер или название.'], ['Карточка', 'Проверьте объект и примечание по доступу.'], ['Маршрут', 'Постройте путь от текущей точки.']] },
  auditions: { icon: '▣', kicker: 'ПОДГОТОВКА', title: 'Ателье для проб', copy: 'Короткая инструкция: куда идти, что подготовить и как связаться с ответственным.', button: 'Открыть инструкцию', steps: [['Выбор', 'Найдите нужное ателье.'], ['Подготовка', 'Проверьте список материалов и доступ.'], ['На месте', 'Используйте QR для навигации внутри.']] },
  admin: { icon: '?', kicker: 'КООРДИНАТОРУ', title: 'Административные инструкции', copy: 'Единый каталог ответов: пропуска, автомобили, помещения и навигация.', button: 'Открыть каталог', steps: [['Найдите вопрос', 'Используйте поиск по обычным словам.'], ['Получите шаги', 'Инструкция показывает действия и документы.'], ['Перейдите к сервису', 'Запустите заявку или маршрут из ответа.']] },
};

const faqAnswers = {
  lost: 'Нажмите «Определить, где я». На улице используется геопозиция, внутри — ближайшая QR-метка.',
  pass: 'Сервис покажет Бюро пропусков на карте и построит маршрут. Фактический порядок получения нужно согласовать.',
  offline: 'В концепции карта, сохранённые объекты и инструкции доступны после первой загрузки. Актуальность данных синхронизируется при появлении сети.',
  access: 'Доступные маршруты могут учитывать лифты, пандусы и закрытые зоны после проверки инфраструктуры и прав доступа.'
};

const routeSteps = [
  { symbol: '↑', title: 'Выйдите от главного входа', copy: 'Держитесь правой стороны и двигайтесь по основной дороге.', mode: 'GPS', modeCopy: 'наружная навигация', remaining: '≈ 6 мин', contextIcon: 'GPS', contextTitle: 'Позиция определяется автоматически', contextCopy: 'Снаружи используется геопозиция телефона' },
  { symbol: '↑', title: 'Идите к Бюро пропусков', copy: 'Продолжайте прямо до отмеченного перекрёстка.', mode: 'GPS', modeCopy: 'наружная навигация', remaining: '≈ 5 мин', contextIcon: '120 м', contextTitle: 'Следующая точка — Бюро пропусков', contextCopy: 'Линия маршрута обновляется по мере движения' },
  { symbol: '↰', title: 'Поверните налево после Бюро пропусков', copy: 'Следуйте вдоль корпуса и не сворачивайте во внутренний двор.', mode: 'GPS', modeCopy: 'наружная навигация', remaining: '≈ 4 мин', contextIcon: '70 м', contextTitle: 'Поворот после контрольной точки', contextCopy: 'На карте появится подтверждение манёвра' },
  { symbol: '6', title: 'Подойдите ко входу в Павильон №6', copy: 'Наружная часть пути заканчивается у входной группы.', mode: 'GPS → QR', modeCopy: 'смена технологии', remaining: '≈ 2 мин', contextIcon: '25 м', contextTitle: 'Подготовьтесь перейти внутрь', contextCopy: 'Следующий шаг попросит отсканировать QR-метку' },
  { symbol: '▦', title: 'Отсканируйте QR-метку у входа', copy: 'Метка подтвердит точную стартовую позицию внутри здания.', mode: 'QR', modeCopy: 'точка внутри здания', remaining: '≈ 2 мин', contextIcon: 'QR', contextTitle: 'GPS внутри здания недостаточно точен', contextCopy: 'QR Q-18 переключит маршрут в indoor-режим', action: 'qr' },
  { symbol: '↑', title: 'Поднимитесь на один уровень', copy: 'После лестницы продолжайте прямо по коридору.', mode: 'QR Q-18', modeCopy: 'indoor-навигация', remaining: '≈ 1 мин', contextIcon: 'Q-18', contextTitle: 'Точка внутри подтверждена', contextCopy: 'Маршрут продолжается от отсканированной метки' },
  { symbol: '✓', title: 'Павильон №6 справа', copy: 'Вы пришли. Карточка объекта остаётся доступна на карте.', mode: 'На месте', modeCopy: 'маршрут завершён', remaining: '0 мин', contextIcon: '✓', contextTitle: 'Пункт назначения достигнут', contextCopy: 'Это демонстрационное завершение маршрута', action: 'complete' },
];

const routeVisualStates = [
  { x: '-52%', y: '-43%', scale: 1.12, cx: 205, cy: 550, progress: 5 },
  { x: '-50%', y: '-47%', scale: 1.2, cx: 216, cy: 460, progress: 24 },
  { x: '-54%', y: '-49%', scale: 1.27, cx: 193, cy: 344, progress: 44 },
  { x: '-57%', y: '-51%', scale: 1.34, cx: 232, cy: 214, progress: 64 },
  { x: '-59%', y: '-53%', scale: 1.4, cx: 210, cy: 160, progress: 76 },
  { indoor: true, cx: 102, cy: 500, progress: 35 },
  { indoor: true, cx: 302, cy: 152, progress: 100 },
];

let activeSheet = null;
let selectedService = 'rooms';
let currentRouteStep = 0;
let selectedPassTarget = 'person';
let selectedPassTerm = 'once';
let passStep = 0;
let passData = { subject: '', date: '2026-09-02', project: 'Демо-проект', destination: 'Павильон №6', purpose: 'Рабочий визит' };
let toastTimer;

function switchScreen(name) {
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === `screen-${name}`));
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.screen === name));
  closeSheets();
}

function renderResults(query = '') {
  const normalizeSearch = (value) => value.toLowerCase().replace(/№/g, ' ').replace(/[^a-zа-яё0-9]+/gi, ' ').trim().replace(/\s+/g, ' ');
  const normalized = normalizeSearch(query);
  const filtered = places.filter((place) => normalizeSearch(`${place.title} ${place.meta}`).includes(normalized));
  document.querySelector('#results-title').textContent = normalized ? `Результаты · ${filtered.length}` : 'Популярные места';
  searchResults.innerHTML = filtered.length ? filtered.map((place) => `
    <button class="result-row" data-place-action="${place.action}">
      <span class="result-icon">${place.icon}</span>
      <span><b>${place.title}</b><small>${place.meta}</small></span>
      <i>→</i>
    </button>`).join('') : '<div class="empty-state">Ничего не найдено.<br>Попробуйте «павильон» или «пропуск».</div>';
}

function openSheet(id, dim = true) {
  closeSheets(false);
  activeSheet = document.querySelector(`#${id}`);
  activeSheet.hidden = false;
  overlay.hidden = !dim || activeSheet.classList.contains('full-sheet');
  app.classList.add('sheet-open');
  if (id === 'search-sheet') setTimeout(() => searchInput.focus(), 80);
}

function closeSheets(removeRoute = false) {
  document.querySelectorAll('.sheet').forEach((sheet) => { sheet.hidden = true; });
  overlay.hidden = true;
  activeSheet = null;
  app.classList.remove('sheet-open');
  if (removeRoute) mapCanvas.classList.remove('route-active');
}

function openObject() { openSheet('object-sheet'); }

function renderRouteOverview() {
  document.querySelector('#route-overview-list').innerHTML = routeSteps.map((step, index) => `
    <div class="route-overview-item ${step.mode.includes('QR') ? 'transition' : ''}">
      <span>${index + 1}</span>
      <span><b>${step.title}</b><small>${step.modeCopy}</small></span>
      <i>${step.mode}</i>
    </div>`).join('');
}

function renderRouteStep() {
  const step = routeSteps[currentRouteStep];
  const visual = routeVisualStates[currentRouteStep];
  const routeSheet = document.querySelector('#route-sheet');
  document.querySelector('#route-step-label').textContent = `ШАГ ${currentRouteStep + 1} ИЗ ${routeSteps.length} · ${step.mode}`;
  document.querySelector('#route-step-symbol').textContent = step.symbol;
  document.querySelector('#route-step-now').textContent = currentRouteStep === routeSteps.length - 1 ? 'ВЫ НА МЕСТЕ' : 'СЕЙЧАС';
  document.querySelector('#route-step-title').textContent = step.title;
  document.querySelector('#route-step-copy').textContent = step.copy;
  document.querySelector('#route-progress-fill').style.width = `${((currentRouteStep + 1) / routeSteps.length) * 100}%`;
  document.querySelector('#route-context-icon').textContent = step.contextIcon;
  document.querySelector('#route-context-title').textContent = step.contextTitle;
  document.querySelector('#route-context-copy').textContent = step.contextCopy;
  document.querySelector('#route-remaining').textContent = step.remaining;
  document.querySelector('#route-mode').textContent = step.mode;
  document.querySelector('#route-mode-copy').textContent = step.modeCopy;
  document.querySelector('#route-prev').disabled = currentRouteStep === 0;
  const nextButton = document.querySelector('#route-next');
  nextButton.innerHTML = step.action === 'qr' ? 'Сканировать QR <span>▦</span>' : step.action === 'complete' ? 'Завершить маршрут <span>✓</span>' : 'Следующий шаг <span>→</span>';
  const context = document.querySelector('.route-step-context');
  context.classList.toggle('qr', step.mode.includes('QR'));
  context.classList.toggle('arrival', step.action === 'complete');
  routeSheet.classList.toggle('route-complete', step.action === 'complete');
  mapContext.innerHTML = `<span class="eyebrow">ШАГ ${currentRouteStep + 1} ИЗ ${routeSteps.length}</span><strong>${step.title}</strong><small>${step.mode} · ${step.remaining} осталось</small>`;

  mapCanvas.classList.add('route-active', 'route-moving');
  mapCanvas.classList.toggle('indoor-mode', Boolean(visual.indoor));
  if (!visual.indoor) {
    mapCanvas.style.setProperty('--map-x', visual.x);
    mapCanvas.style.setProperty('--map-y', visual.y);
    mapCanvas.style.setProperty('--map-scale', visual.scale);
    document.querySelector('#route-position-dot').setAttribute('cx', visual.cx);
    document.querySelector('#route-position-dot').setAttribute('cy', visual.cy);
    document.querySelector('#route-position-halo').setAttribute('cx', visual.cx);
    document.querySelector('#route-position-halo').setAttribute('cy', visual.cy);
    document.querySelector('#route-complete-path').style.strokeDasharray = `${visual.progress} ${100 - visual.progress}`;
  } else {
    document.querySelector('#indoor-position-dot').setAttribute('cx', visual.cx);
    document.querySelector('#indoor-position-dot').setAttribute('cy', visual.cy);
    document.querySelector('#indoor-position-halo').setAttribute('cx', visual.cx);
    document.querySelector('#indoor-position-halo').setAttribute('cy', visual.cy);
    document.querySelector('#indoor-complete-path').style.strokeDasharray = `${visual.progress} ${100 - visual.progress}`;
  }
  clearTimeout(renderRouteStep.motionTimer);
  renderRouteStep.motionTimer = setTimeout(() => mapCanvas.classList.remove('route-moving'), 850);
}

function startRoute() {
  switchScreen('map');
  currentRouteStep = 0;
  mapCanvas.classList.add('route-active');
  mapCanvas.classList.remove('indoor-mode', 'zoomed');
  const initialVisual = routeVisualStates[0];
  mapCanvas.style.setProperty('--map-x', initialVisual.x);
  mapCanvas.style.setProperty('--map-y', initialVisual.y);
  mapCanvas.style.setProperty('--map-scale', initialVisual.scale);
  document.querySelector('#route-complete-path').style.strokeDasharray = `${initialVisual.progress} ${100 - initialVisual.progress}`;
  mapContext.innerHTML = '<span class="eyebrow">МАРШРУТ ГОТОВ</span><strong>К Павильону №6</strong><small>7 шагов · GPS → QR</small>';
  renderRouteOverview();
  setTimeout(() => openSheet('route-overview-sheet'), 220);
}

function beginRoute() {
  currentRouteStep = 0;
  renderRouteStep();
  openSheet('route-sheet');
}

function nextRouteStep() {
  const step = routeSteps[currentRouteStep];
  if (step.action === 'qr') { openQR(); return; }
  if (step.action === 'complete') { finishRoute(); return; }
  currentRouteStep += 1;
  renderRouteStep();
}

function previousRouteStep() {
  if (currentRouteStep === 0) return;
  currentRouteStep -= 1;
  renderRouteStep();
}

function showRouteOverview() {
  renderRouteOverview();
  openSheet('route-overview-sheet');
}

function openQR() { openSheet('qr-sheet', false); }

function scanDemo() {
  closeSheets();
  switchScreen('map');
  currentRouteStep = 5;
  mapCanvas.classList.add('route-active');
  mapContext.innerHTML = '<span class="eyebrow">ВЫ ЗДЕСЬ · QR Q-18</span><strong>Коридор, демонстрационная точка</strong><small>Позиция подтверждена меткой</small>';
  showToast('Точка определена. Маршрут внутри здания продолжен.');
  renderRouteStep();
  setTimeout(() => openSheet('route-sheet'), 650);
}

function finishRoute() {
  closeSheets(true);
  mapCanvas.classList.remove('zoomed');
  mapContext.innerHTML = '<span class="eyebrow">МАРШРУТ ЗАВЕРШЁН</span><strong>Павильон №6</strong><small>Вы на месте · демо-сценарий</small>';
  showToast('Маршрут завершён. Павильон №6 найден.');
}

function openService(key) {
  const service = services[key] || services.rooms;
  selectedService = key;
  document.querySelector('#service-sheet-kicker').textContent = service.kicker;
  document.querySelector('#service-detail-icon').textContent = service.icon;
  document.querySelector('#service-detail-title').textContent = service.title;
  document.querySelector('#service-detail-copy').textContent = service.copy;
  document.querySelector('#service-detail-steps').innerHTML = service.steps.map((step, index) => `<div class="instruction-step"><span>${index + 1}</span><div><b>${step[0]}</b><small>${step[1]}</small></div></div>`).join('');
  document.querySelector('#service-sheet .primary-button').innerHTML = `${service.button} <span>→</span>`;
  openSheet('service-sheet');
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.querySelector('p').textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function escapeMarkup(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function setPassTarget(target) {
  selectedPassTarget = target;
  passStep = 0;
  document.querySelectorAll('[data-pass-target]').forEach((button) => button.classList.toggle('active', button.dataset.passTarget === target));
  renderPassStep();
}

function setPassTerm(term) {
  selectedPassTerm = term;
  passStep = 0;
  document.querySelectorAll('[data-pass-term]').forEach((option) => option.classList.toggle('selected', option.dataset.passTerm === term));
  renderPassStep();
  showToast(term === 'quarter' ? 'Выбран квартальный пропуск · демо-сценарий' : 'Выбран разовый пропуск · демо-сценарий');
}

function renderPassStep() {
  const body = document.querySelector('#pass-step-body');
  const progress = [...document.querySelectorAll('#pass-progress span')];
  const label = document.querySelector('#pass-step-label');
  const previous = document.querySelector('#pass-prev');
  const next = document.querySelector('#pass-next');
  const actions = document.querySelector('.pass-actions');
  if (!body || document.querySelector('#pass-workspace').hidden) return;

  progress.forEach((item, index) => item.classList.toggle('active', index <= Math.min(passStep, 2)));
  previous.disabled = passStep === 0 || passStep === 3;
  actions.hidden = passStep === 3;
  label.textContent = passStep < 3 ? `ШАГ ${passStep + 1} ИЗ 3` : 'ЗАЯВКА СОЗДАНА · ДЕМО';

  if (passStep === 0) {
    const title = selectedPassTarget === 'car' ? 'Какой автомобиль' : 'Кого нужно пропустить';
    const field = selectedPassTarget === 'car' ? 'Марка и госномер' : 'Фамилия и имя';
    const placeholder = selectedPassTarget === 'car' ? 'Например, А000АА 000' : 'Например, Анна Смирнова';
    body.innerHTML = `<h3>${title}</h3>
      <label><span>${field}</span><input id="pass-subject" autocomplete="off" value="${escapeMarkup(passData.subject)}" placeholder="${placeholder}" /></label>
      <label><span>${selectedPassTerm === 'quarter' ? 'Дата начала квартала' : 'Дата визита'}</span><input id="pass-date" type="date" value="${escapeMarkup(passData.date)}" /></label>`;
    next.hidden = false;
    next.innerHTML = 'Продолжить <span>→</span>';
  } else if (passStep === 1) {
    body.innerHTML = `<h3>Параметры доступа</h3>
      <label><span>Компания или проект</span><input id="pass-project" autocomplete="off" value="${escapeMarkup(passData.project)}" /></label>
      <label><span>Куда направляется</span><input id="pass-destination" autocomplete="off" value="${escapeMarkup(passData.destination)}" /></label>
      <label><span>Цель визита</span><input id="pass-purpose" autocomplete="off" value="${escapeMarkup(passData.purpose)}" /></label>`;
    next.hidden = false;
    next.innerHTML = 'Проверить заявку <span>→</span>';
  } else if (passStep === 2) {
    body.innerHTML = `<h3>Проверьте перед отправкой</h3>
      <div class="pass-review">
        <span><small>Получатель</small><b>${escapeMarkup(passData.subject || 'Не указано')}</b></span>
        <span><small>Тип</small><b>${selectedPassTarget === 'car' ? 'Автомобиль' : 'Человек'} · ${selectedPassTerm === 'quarter' ? 'квартальный' : 'разовый'}</b></span>
        <span><small>Дата</small><b>${escapeMarkup(passData.date)}</b></span>
        <span><small>Проект</small><b>${escapeMarkup(passData.project)}</b></span>
        <span><small>Назначение</small><b>${escapeMarkup(passData.destination)}</b></span>
      </div>`;
    next.hidden = false;
    next.innerHTML = 'Создать демо-заявку <span>→</span>';
  } else {
    body.innerHTML = `<div class="pass-success"><div class="success-icon">✓</div><h3>Заявка создана</h3><p>В прототипе она сохранена только в текущем сеансе и не отправлена в 1С.</p><span class="request-id">DEMO-1C-0248</span></div>`;
  }
}

function collectPassStep() {
  if (passStep === 0) {
    const subject = document.querySelector('#pass-subject');
    if (!subject.value.trim()) {
      subject.focus();
      showToast('Добавьте демонстрационные данные');
      return false;
    }
    passData.subject = subject.value.trim();
    passData.date = document.querySelector('#pass-date').value;
  }
  if (passStep === 1) {
    passData.project = document.querySelector('#pass-project').value.trim() || 'Демо-проект';
    passData.destination = document.querySelector('#pass-destination').value.trim() || 'Павильон №6';
    passData.purpose = document.querySelector('#pass-purpose').value.trim() || 'Рабочий визит';
  }
  return true;
}

function nextPassStep() {
  if (!collectPassStep()) return;
  if (passStep < 3) passStep += 1;
  renderPassStep();
  if (passStep === 3) showToast('Демо-заявка создана локально и не отправлена в 1С');
}

function previousPassStep() {
  if (passStep === 0 || passStep === 3) return;
  passStep -= 1;
  renderPassStep();
}

function portalLogin() {
  const button = document.querySelector('#portal-login-sheet [data-action="portal-login"]');
  button.disabled = true;
  button.innerHTML = 'Проверяем роль координатора <span>···</span>';
  document.querySelectorAll('.portal-status-flow span').forEach((item) => item.classList.add('active'));
  setTimeout(() => {
    closeSheets();
    document.querySelector('#pass-auth-gate').hidden = true;
    document.querySelector('#pass-workspace').hidden = false;
    passStep = 0;
    renderPassStep();
    button.disabled = false;
    button.innerHTML = 'Войти в демо-режиме <span>→</span>';
    showToast('Демо-вход выполнен · роль координатора подтверждена');
  }, 650);
}

function portalLogout() {
  document.querySelector('#pass-auth-gate').hidden = false;
  document.querySelector('#pass-workspace').hidden = true;
  document.querySelectorAll('.portal-status-flow span').forEach((item, index) => item.classList.toggle('active', index === 0));
  showToast('Демо-сессия портала 1С завершена');
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;

  if (button.dataset.screen) switchScreen(button.dataset.screen);
  if (button.dataset.service) openService(button.dataset.service);
  if (button.dataset.passTarget) setPassTarget(button.dataset.passTarget);
  if (button.dataset.passTerm) setPassTerm(button.dataset.passTerm);
  if (button.dataset.faq) {
    const existing = button.querySelector('.faq-answer');
    document.querySelectorAll('.faq-list button').forEach((item) => { if (item !== button) { item.classList.remove('open'); item.querySelector('.faq-answer')?.remove(); } });
    if (existing) { existing.remove(); button.classList.remove('open'); }
    else { button.classList.add('open'); button.insertAdjacentHTML('beforeend', `<span class="faq-answer">${faqAnswers[button.dataset.faq]}</span>`); }
  }
  if (button.dataset.placeAction) {
    if (button.dataset.placeAction === 'object') openObject();
    else if (button.dataset.placeAction === 'route') startRoute();
    else openService(button.dataset.placeAction === 'food' ? 'food' : button.dataset.placeAction === 'auditions' ? 'auditions' : 'actors');
  }

  const actions = {
    home: () => switchScreen('map'),
    'open-search': () => { renderResults(); openSheet('search-sheet', false); },
    'clear-search': () => { searchInput.value = ''; renderResults(); searchInput.focus(); },
    'close-sheets': () => closeSheets(),
    'open-object': openObject,
    'start-route': startRoute,
    'begin-route': beginRoute,
    'next-route-step': nextRouteStep,
    'previous-route-step': previousRouteStep,
    'show-route-overview': showRouteOverview,
    'close-route': finishRoute,
    'open-qr': openQR,
    'scan-demo': scanDemo,
    'center-map': () => { mapCanvas.classList.remove('zoomed'); showToast('Карта центрирована по демонстрационной точке входа'); },
    'zoom-map': () => mapCanvas.classList.toggle('zoomed'),
    'open-portal-login': () => openSheet('portal-login-sheet', false),
    'portal-login': portalLogin,
    'portal-logout': portalLogout,
    'next-pass-step': nextPassStep,
    'previous-pass-step': previousPassStep,
    'toggle-offline': () => {
      app.classList.toggle('offline');
      const offline = app.classList.contains('offline');
      document.querySelector('#connection-label').textContent = offline ? 'Офлайн-режим' : 'Карта загружена';
      showToast(offline ? 'Офлайн-демо: схема и инструкции остаются доступны.' : 'Онлайн-режим восстановлен.');
    },
    favorite: () => { button.classList.toggle('active'); button.textContent = button.classList.contains('active') ? '♥' : '♡'; showToast(button.classList.contains('active') ? 'Объект сохранён на устройстве.' : 'Объект удалён из сохранённых.'); },
    'service-primary': () => {
      closeSheets();
      if (selectedService === 'food' || selectedService === 'actors' || selectedService === 'auditions') { switchScreen('map'); showToast('Категория показана на карте в демонстрационном режиме.'); }
      else showToast('Сценарий готов к подключению согласованного процесса.');
    },
  };
  if (action && actions[action]) actions[action]();
});

overlay.addEventListener('click', () => closeSheets());
searchInput.addEventListener('input', () => renderResults(searchInput.value));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSheets();
  if (event.key === '/' && activeSheet !== document.querySelector('#search-sheet')) { event.preventDefault(); renderResults(); openSheet('search-sheet', false); }
});

renderResults();
renderRouteOverview();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
