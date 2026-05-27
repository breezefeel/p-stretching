/**
 * 힐링트리 랜딩 페이지 통합 상담 모달 (프로필.html과 동일 GAS 파이프라인)
 */
(function (global) {
  'use strict';

  var CONSULT_WEBHOOK_URL =
    'https://script.google.com/macros/s/AKfycbwVJSc6rY5tcBSB1VaRi4DBEXGyUBr1ADFfs6QEA9Z9bu0G-0mdMAv374-MdPVYMnSaeQ/exec';

  var KAKAO_CHAT_URL = 'http://pf.kakao.com/_nVSxdn/chat';

  var PAGE_META = {
    pstretching: {
      pageTitle: 'Re:Al Movement',
      category: '움직임·자세',
      program: 'P-스트레칭 / Re:Al Movement',
      accent: { main: '#3498DB', mid: '#287BBF', bg: '#eff6ff', border: '#bfdbfe' },
    },
    beauty: {
      pageTitle: '리:얼 작은얼굴 & 리:얼핏',
      category: '얼굴 교정·관리',
      program: '리:얼 작은얼굴 · 리:얼핏 페이스',
      accent: { main: '#ea580c', mid: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
    },
    inside: {
      pageTitle: 'Re:Al 인사이드',
      category: '성향·자기이해',
      program: 'I-FAS 지문 검사 / 성향 분석',
      accent: { main: '#9333ea', mid: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
    },
  };

  var BRANCH_LABELS = {
    yaksu: '서울 약수점',
    jakjeon: '인천 작전점',
  };

  var landingPageKey = '';
  var landingIntent = 'yaksu';
  var consultFlowKind = 'landing';
  var modalInjected = false;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getMeta() {
    return PAGE_META[landingPageKey] || PAGE_META.pstretching;
  }

  function applyAccent(meta) {
    if (!meta || !meta.accent) return;
    var r = document.documentElement;
    r.style.setProperty('--consult-accent', meta.accent.main);
    r.style.setProperty('--consult-accent-mid', meta.accent.mid);
    r.style.setProperty('--consult-accent-bg', meta.accent.bg);
    r.style.setProperty('--consult-accent-border', meta.accent.border);
  }

  function injectConsultModal() {
    if (modalInjected || document.getElementById('consultModal')) {
      modalInjected = true;
      return;
    }
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<iframe name="consultHiddenFrame" id="consultHiddenFrame" title="상담 접수 전송" style="display:none;width:0;height:0;border:0;visibility:hidden;"></iframe>' +
      '<div id="consultModal" class="consult-modal hidden" aria-hidden="true" role="dialog" aria-labelledby="consultModalTitle">' +
      '  <div class="consult-modal-backdrop" data-consult-close></div>' +
      '  <div class="consult-modal-panel">' +
      '    <button type="button" class="consult-modal-close" data-consult-close aria-label="닫기">×</button>' +
      '    <h2 id="consultModalTitle" class="consult-modal-title">상담 신청</h2>' +
      '    <p id="consultModalSub" class="consult-modal-sub hidden"></p>' +
      '    <div class="consult-contact-block" id="consultContactBlock">' +
      '      <div class="consult-field">' +
      '        <span class="consult-field-label-block">연락처</span>' +
      '        <div class="consult-phone-row" role="group" aria-label="휴대전화 번호">' +
      '          <input type="text" class="consult-phone-part consult-phone-prefix" id="consultPhoneP1" value="010" readonly inputmode="numeric" tabindex="-1" aria-label="앞자리 010">' +
      '          <span class="consult-phone-sep" aria-hidden="true">-</span>' +
      '          <input type="tel" class="consult-phone-part" id="consultPhoneP2" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="tel-national" aria-label="중간 네 자리" placeholder="0000">' +
      '          <span class="consult-phone-sep" aria-hidden="true">-</span>' +
      '          <input type="tel" class="consult-phone-part" id="consultPhoneP3" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="tel-national" aria-label="끝 네 자리" placeholder="0000">' +
      '        </div>' +
      '      </div>' +
      '      <div class="consult-field">' +
      '        <label for="consultName" id="consultNameLabel">이름</label>' +
      '        <input type="text" id="consultName" autocomplete="name" placeholder="홍길동" maxlength="40">' +
      '      </div>' +
      '    </div>' +
      '    <div class="consult-summary-block" id="consultSummaryBlock">' +
      '      <label class="consult-summary-label">선택하신 내용</label>' +
      '      <div id="consultSummaryBody" class="consult-summary-box"></div>' +
      '    </div>' +
      '    <div id="consultExpertFields" class="consult-field hidden">' +
      '      <label for="consultInquiry">문의 사항</label>' +
      '      <textarea id="consultInquiry" maxlength="2000" placeholder="일정·비용·과정 내용 등 궁금하신 점을 적어 주세요."></textarea>' +
      '    </div>' +
      '    <div class="consult-actions" id="consultActionsRow">' +
      '      <button type="button" class="consult-submit" id="consultSubmitBtn">보내기</button>' +
      '      <a href="' +
      KAKAO_CHAT_URL +
      '" target="_blank" rel="noopener noreferrer" class="consult-chat-btn hidden" id="consultChatBtn">채팅 상담</a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrap);

    document.querySelectorAll('[data-consult-close]').forEach(function (el) {
      el.addEventListener('click', closeConsultModal);
    });
    document.getElementById('consultSubmitBtn').addEventListener('click', submitLandingConsultForm);
    document.getElementById('consultPhoneP2').addEventListener('input', onConsultPhoneMidInput);
    document.getElementById('consultPhoneP3').addEventListener('input', onConsultPhoneLastInput);
    document.getElementById('consultPhoneP3').addEventListener('keydown', onConsultPhoneLastKeydown);

    modalInjected = true;
  }

  function buildLandingSelectionRows() {
    var meta = getMeta();
    var branch = BRANCH_LABELS[landingIntent] || BRANCH_LABELS.yaksu;
    return [
      { dt: '선택 경로', dd: '랜딩 페이지 › ' + meta.pageTitle },
      { dt: '구분', dd: meta.category },
      { dt: '지점', dd: branch },
      { dt: '프로그램', dd: meta.program },
    ];
  }

  function buildLandingSummaryPlainText() {
    return buildLandingSelectionRows()
      .map(function (r) {
        return r.dt + ': ' + r.dd;
      })
      .join('\n');
  }

  function buildLandingSummaryText() {
    return buildLandingSummaryPlainText();
  }

  function formatLandingSummaryHtml() {
    var rows = buildLandingSelectionRows();
    return (
      '<dl>' +
      rows
        .map(function (r) {
          return '<dt>' + escapeHtml(r.dt) + '</dt><dd>' + escapeHtml(r.dd) + '</dd>';
        })
        .join('') +
      '</dl>'
    );
  }

  function consultPhoneDigitsOnly(el, maxLen) {
    el.value = el.value.replace(/\D/g, '').slice(0, maxLen);
  }

  function onConsultPhoneMidInput() {
    var p2 = document.getElementById('consultPhoneP2');
    var p3 = document.getElementById('consultPhoneP3');
    var d = p2.value.replace(/\D/g, '');
    if (d.length > 4) {
      p2.value = d.slice(0, 4);
      p3.value = d.slice(4, 8);
      p3.focus();
      return;
    }
    p2.value = d;
    if (p2.value.length >= 4) {
      p3.focus();
      p3.select();
    }
  }

  function onConsultPhoneLastInput() {
    consultPhoneDigitsOnly(document.getElementById('consultPhoneP3'), 4);
  }

  function onConsultPhoneLastKeydown(e) {
    var p3 = document.getElementById('consultPhoneP3');
    var p2 = document.getElementById('consultPhoneP2');
    if (e.key === 'Backspace' && !p3.value.length) p2.focus();
  }

  function getConsultPhoneCombined() {
    var b = document.getElementById('consultPhoneP2').value.replace(/\D/g, '');
    var c = document.getElementById('consultPhoneP3').value.replace(/\D/g, '');
    return { digits: '010' + b + c, last4: c };
  }

  function openLandingConsult(opts) {
    opts = opts || {};
    landingIntent = opts.intent || 'yaksu';
    consultFlowKind = 'landing';
    injectConsultModal();
    applyAccent(getMeta());

    document.getElementById('consultModalTitle').textContent = '상담 신청';
    document.getElementById('consultExpertFields').classList.add('hidden');

    var summaryBox = document.getElementById('consultSummaryBody');
    if (summaryBox) {
      summaryBox.classList.remove('hidden');
      summaryBox.innerHTML = formatLandingSummaryHtml();
    }

    document.getElementById('consultName').value = '';
    document.getElementById('consultPhoneP2').value = '';
    document.getElementById('consultPhoneP3').value = '';

    document.getElementById('consultModal').classList.remove('hidden');
    document.getElementById('consultModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      document.getElementById('consultPhoneP2').focus();
    });
  }

  function closeConsultModal() {
    var modal = document.getElementById('consultModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function submitLandingConsultForm() {
    var name = document.getElementById('consultName').value.trim();
    var phoneInfo = getConsultPhoneCombined();
    var phone = phoneInfo.digits;
    var last4 = phoneInfo.last4;
    var summaryText = buildLandingSummaryText();

    if (!name) {
      alert('이름을 입력해 주세요.');
      return;
    }
    if (phone.length !== 11 || !/^010\d{8}$/.test(phone)) {
      alert('연락처를 확인해 주세요. (010 포함 11자리)');
      return;
    }
    if (!CONSULT_WEBHOOK_URL) {
      alert('서버 URL이 설정되지 않았습니다. 관리자에게 문의해 주세요.');
      return;
    }

    var meta = getMeta();
    var branch = BRANCH_LABELS[landingIntent] || BRANCH_LABELS.yaksu;
    var payload = {
      name: name,
      phone: phone,
      flow: consultFlowKind,
      summaryText: summaryText,
      adminSummaryText: summaryText,
      branch: branch,
      selections: buildLandingSelectionRows(),
      landingPage: landingPageKey,
      landingIntent: landingIntent,
      pageTitle: meta.pageTitle,
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    var btn = document.getElementById('consultSubmitBtn');
    btn.disabled = true;

    var form = document.createElement('form');
    form.method = 'POST';
    form.action = CONSULT_WEBHOOK_URL;
    form.target = 'consultHiddenFrame';
    form.acceptCharset = 'UTF-8';
    var inp = document.createElement('input');
    inp.type = 'hidden';
    inp.name = 'data';
    inp.value = JSON.stringify(payload);
    form.appendChild(inp);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    setTimeout(function () {
      btn.disabled = false;
    }, 800);
    closeConsultModal();
    alert('접수되었습니다.\n\n뒷자리 ' + last4 + ' 번호로 곧 연락드리겠습니다.');
  }

  function initLandingConsult(config) {
    config = config || {};
    landingPageKey = config.pageKey || 'pstretching';
    injectConsultModal();
    applyAccent(getMeta());
  }

  global.initLandingConsult = initLandingConsult;
  global.openLandingConsult = openLandingConsult;
  global.closeConsultModal = closeConsultModal;
  global.onConsultPhoneMidInput = onConsultPhoneMidInput;
  global.onConsultPhoneLastInput = onConsultPhoneLastInput;
  global.onConsultPhoneLastKeydown = onConsultPhoneLastKeydown;
})(typeof window !== 'undefined' ? window : this);
