import "./style.css";
import "./connection";
import * as globals from "./globals";

const app = document.querySelector('#app');

if (app) {
  app.innerHTML = `
  <div id="connect" style="text-align: center"><table style="display: inline-block">
    <tr><td><span>Host: </span></td><td><input id="host" /></td></tr>
    <tr><td><span>Key: </span></td><td><input id="key" /></td></tr>
    <tr><td><span>Id: </span></td><td><input id="id" /></td></tr>
    <tr><td></td><td><button onclick="connect();">Connect</button></td></tr>
  </table></div>
  <div id="password" style="display: none;">
    <input type="password" id="password" />
    <button id="confirm" onclick="confirm()">Confirm</button>
    <button id="cancel" onclick="cancel();">Cancel</button>
  </div>
  <div id="status" style="display: none;">
    <div id="text" style="line-height: 2em"></div>
    <button id="cancel" onclick="cancel();">Cancel</button>
  </div>
  <div id="canvas" style="display: none;">
    <button id="cancel" onclick="cancel();">Cancel</button>
    <canvas id="player"></canvas>
    <canvas id="test-yuv-decoder-canvas"></canvas>
  </div>
`;

  let player;
  window.init();

  document.body.onload = () => {
    const host = document.querySelector('#host');
    host.value = localStorage.getItem('custom-rendezvous-server') || import.meta.env.VITE_RD_HOST || '';
    const id = document.querySelector('#id');
    id.value = localStorage.getItem('id');
    const key = document.querySelector('#key');
    key.value = localStorage.getItem('key') || import.meta.env.VITE_RD_KEY || '';
    player = YUVCanvas.attach(document.getElementById('player'));
    // globals.sendOffCanvas(document.getElementById('player'));
  };

  window.connect = () => {
    const host = document.querySelector('#host');
    localStorage.setItem('custom-rendezvous-server', host.value);
    const id = document.querySelector('#id');
    localStorage.setItem('id', id.value);
    const key = document.querySelector('#key');
    localStorage.setItem('key', key.value);
    const func = async () => {
      const conn = globals.newConn();
      conn.setMsgbox(msgbox);
      conn.setDraw((f) => {
        /*
        if (!(document.getElementById('player').width > 0)) {
          document.getElementById('player').width = f.format.displayWidth;
          document.getElementById('player').height = f.format.displayHeight;
        }
        */
        globals.draw(f);
        player.drawFrame(f);
      });
      document.querySelector('div#status').style.display = 'block';
      document.querySelector('div#connect').style.display = 'none';
      document.querySelector('div#text').innerHTML = 'Connecting ...';
      await conn.start(id.value);
    };
    func();
  }

  function msgbox(type, title, text) {
    if (!globals.getConn()) return;
    if (type == 'input-password') {
      document.querySelector('div#status').style.display = 'none';
      document.querySelector('div#password').style.display = 'block';
    } else if (!type) {
      document.querySelector('div#canvas').style.display = 'block';
      document.querySelector('div#password').style.display = 'none';
      document.querySelector('div#status').style.display = 'none';
    } else if (type == 'error') {
      document.querySelector('div#status').style.display = 'block';
      document.querySelector('div#canvas').style.display = 'none';
      document.querySelector('div#text').innerHTML = '<div style="color: red; font-weight: bold;">' + text + '</div>';
    } else {
      document.querySelector('div#password').style.display = 'none';
      document.querySelector('div#status').style.display = 'block';
      document.querySelector('div#text').innerHTML = '<div style="font-weight: bold;">' + text + '</div>';
    }
  }

  window.cancel = () => {
    globals.close();
    document.querySelector('div#connect').style.display = 'block';
    document.querySelector('div#password').style.display = 'none';
    document.querySelector('div#status').style.display = 'none';
    document.querySelector('div#canvas').style.display = 'none';
  }

  window.confirm = () => {
    const password = document.querySelector('input#password').value;
    if (password) {
      document.querySelector('div#password').style.display = 'none';
      globals.getConn().login(password);
    }
  }

  // Remote input: KeyboardEvent.code -> RustDesk key names (see KEY_MAP in gen_js_from_hbb.ts).
  const CODE_MAP = {
    Enter: 'VK_RETURN', NumpadEnter: 'VK_RETURN', Backspace: 'VK_BACK', Tab: 'VK_TAB',
    Escape: 'VK_ESCAPE', Space: 'VK_SPACE', Delete: 'VK_DELETE', Insert: 'VK_INSERT',
    Home: 'VK_HOME', End: 'VK_END', PageUp: 'VK_PRIOR', PageDown: 'VK_NEXT',
    ArrowLeft: 'VK_LEFT', ArrowRight: 'VK_RIGHT', ArrowUp: 'VK_UP', ArrowDown: 'VK_DOWN',
    ShiftLeft: 'VK_SHIFT', ShiftRight: 'RShift', ControlLeft: 'VK_CONTROL', ControlRight: 'RControl',
    AltLeft: 'VK_MENU', AltRight: 'RAlt', MetaLeft: 'Meta', MetaRight: 'RWin', ContextMenu: 'Apps',
    CapsLock: 'VK_CAPITAL', Pause: 'VK_PAUSE', PrintScreen: 'VK_SNAPSHOT',
    Comma: 'VK_COMMA', Slash: 'VK_SLASH', Semicolon: 'VK_SEMICOLON', Quote: 'VK_QUOTE',
    BracketLeft: 'VK_LBRACKET', BracketRight: 'VK_RBRACKET', Backslash: 'VK_BACKSLASH',
    Minus: 'VK_MINUS', Equal: 'VK_PLUS', NumpadDivide: 'VK_DIVIDE', NumpadMultiply: 'VK_MULTIPLY',
    NumpadSubtract: 'VK_SUBTRACT', NumpadAdd: 'VK_ADD', NumpadDecimal: 'VK_DECIMAL',
  };

  function keyName(code) {
    if (CODE_MAP[code]) return CODE_MAP[code];
    let m = /^Key([A-Z])$/.exec(code);
    if (m) return 'VK_' + m[1];
    m = /^Digit(\d)$/.exec(code);
    if (m) return 'VK_' + m[1];
    m = /^Numpad(\d)$/.exec(code);
    if (m) return 'VK_NUMPAD' + m[1];
    if (/^F([1-9]|1[0-2])$/.test(code)) return 'VK_' + code;
    return null;
  }

  function remoteActive() {
    return globals.getConn() && document.querySelector('div#canvas').style.display === 'block';
  }

  function onKey(e, down) {
    if (!remoteActive()) return;
    e.preventDefault();
    const name = keyName(e.code);
    const conn = globals.getConn();
    if (name) {
      conn.inputKey(name, down, false, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey);
    } else if (down && e.key.length === 1) {
      conn.inputString(e.key);
    }
  }
  document.addEventListener('keydown', (e) => onKey(e, true));
  document.addEventListener('keyup', (e) => onKey(e, false));

  function sendMouse(e, type, button) {
    const canvas = document.getElementById('player');
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.round((e.clientX - rect.left) * canvas.width / rect.width);
    const y = Math.round((e.clientY - rect.top) * canvas.height / rect.height);
    // mask: low 3 bits = 0 move, 1 down, 2 up, 3 wheel; button bits << 3 = left 1, right 2, middle 4
    const buttons = [1, 4, 2][button] || 0; // DOM: 0 left, 1 middle, 2 right
    const mask = type | (buttons << 3);
    globals.getConn().inputMouse(mask, x, y, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey);
  }

  const playerEl = document.getElementById('player');
  playerEl.addEventListener('mousemove', (e) => remoteActive() && sendMouse(e, 0, -1));
  playerEl.addEventListener('mousedown', (e) => { if (remoteActive()) { e.preventDefault(); sendMouse(e, 1, e.button); } });
  playerEl.addEventListener('mouseup', (e) => { if (remoteActive()) { e.preventDefault(); sendMouse(e, 2, e.button); } });
  playerEl.addEventListener('contextmenu', (e) => e.preventDefault());
  playerEl.addEventListener('wheel', (e) => {
    if (!remoteActive()) return;
    e.preventDefault();
    globals.getConn().inputMouse(3, 0, e.deltaY > 0 ? -1 : 1, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey);
  }, { passive: false });
}