// Privacy policy, terms and about page text. Languages without their own
// version link to the English page.

import { KOFI_URL } from '../src/lib/site';
import type { LangCode } from './shared';

export interface LegalPage {
  title: string;
  description: string;
  sections: { h?: string; p: string[] }[];
}

export type LegalKind = 'privacy' | 'terms' | 'about';

const REPO = 'https://github.com/bill2712/-EasySplit-HK-';
const UPDATED = '2026-10-21';

const en: Record<LegalKind, LegalPage> = {
  privacy: {
    title: 'Privacy policy',
    description: 'How EasySplit handles your data: groups stay on your device, nothing is tracked, and live sharing is opt-in.',
    sections: [
      { p: [`Last updated: ${UPDATED}`, 'EasySplit is a free bill-splitting calculator. We built it so that you do not need an account and we do not need your personal data.'] },
      {
        h: 'Data stored on your device',
        p: [
          'The names, amounts and groups you enter are saved in your browser’s local storage on your own device. They are not sent to us.',
          'You can export a backup file at any time (Settings → Back up) and delete everything by clearing the site data in your browser.',
        ],
      },
      {
        h: 'Live sharing (optional)',
        p: [
          'If you turn on live sharing for a group, that group (its name, member names, payment details you entered and expenses) is stored in Google Firebase (Cloud Firestore) so the people you share the link with can see and edit it in real time.',
          'Anyone who has the link can open and edit a live group, so only share it with people you trust and do not enter sensitive information. You can stop syncing on your device at any time; ask us via GitHub if you need an online group deleted.',
        ],
      },
      {
        h: 'Share links and QR codes',
        p: ['A normal share link contains a compressed copy of the group inside the link itself. It is not uploaded anywhere, but whoever receives the link can read it.'],
      },
      {
        h: 'Third-party services',
        p: [
          'Exchange rates are downloaded from open.er-api.com when you log an expense in another currency. Like any website, that service can see your IP address.',
          'The “Support us” button opens Ko-fi, which has its own privacy policy.',
          'The site is hosted on GitHub Pages, which may keep standard server logs.',
        ],
      },
      { h: 'Cookies and tracking', p: ['EasySplit does not use cookies, advertising or tracking.'] },
      { h: 'Contact', p: [`Questions or requests: open an issue at ${REPO}/issues.`] },
    ],
  },
  terms: {
    title: 'Terms of use',
    description: 'The terms for using EasySplit, a free bill-splitting calculator.',
    sections: [
      { p: [`Last updated: ${UPDATED}`, 'By using EasySplit you agree to these terms.'] },
      {
        h: 'Estimates only',
        p: [
          'EasySplit helps you split bills. Service charges, taxes, tipping customs and exchange rates shown in the app are typical values and may be out of date or differ by city, state and restaurant. Always check your receipt and the actual rates.',
          'You are responsible for checking the amounts before you pay or ask anyone to pay.',
        ],
      },
      {
        h: 'No warranty',
        p: ['EasySplit is provided free of charge “as is”, without any warranty. To the extent allowed by law, we are not liable for any loss arising from its use, including lost data.'],
      },
      {
        h: 'Your content',
        p: ['You keep ownership of what you enter. Do not use live sharing to store unlawful content or other people’s personal data without their permission.'],
      },
      { h: 'Changes', p: ['We may update the app and these terms. The date above shows the latest version.'] },
    ],
  },
  about: {
    title: 'About EasySplit',
    description: 'EasySplit (夾錢易) is a free, privacy-friendly calculator for splitting restaurant bills, gatherings and trips around the world.',
    sections: [
      {
        p: [
          'EasySplit (夾錢易) started in Hong Kong, where “加一” — the 10% service charge — makes every group dinner a small maths puzzle. It grew into a calculator for meals, gatherings and trips anywhere in the world.',
          'It knows the usual service charges, taxes and tipping customs of 30+ countries, handles any currency, and works out the fewest transfers to settle up.',
        ],
      },
      {
        h: 'Principles',
        p: ['Free to use and ad-free. No sign-up. Works offline. Your data stays on your device unless you choose to share a group live.'],
      },
      { h: 'Support', p: [`EasySplit is a side project. If it helps you and your friends, you can support it on Ko-fi: ${KOFI_URL}`] },
      { h: 'Feedback', p: [`Found a wrong tax rate or a bug? Tell us at ${REPO}/issues.`] },
    ],
  },
};

const zhHK: Record<LegalKind, LegalPage> = {
  privacy: {
    title: '私隱政策',
    description: '夾錢易點樣處理你嘅資料：帳本只存喺你部機、唔追蹤、即時共享要你自己開。',
    sections: [
      { p: [`最後更新：${UPDATED}`, '夾錢易係一個免費嘅夾錢計算機。我哋設計成唔使註冊，亦唔需要你嘅個人資料。'] },
      {
        h: '存喺你部機嘅資料',
        p: ['你輸入嘅名、金額同帳本都只會存喺你部機瀏覽器嘅本機儲存（local storage），唔會傳俾我哋。', '你隨時可以喺「設定 → 備份」下載備份檔；清除瀏覽器嘅網站資料就會刪晒所有內容。'],
      },
      {
        h: '即時共享（自選）',
        p: [
          '如果你為某個帳本開啟即時共享，嗰個帳本（名稱、成員名、你填嘅收款資料同支出）會存喺 Google Firebase（Cloud Firestore），等收到連結嘅朋友可以即時睇同改。',
          '任何有連結嘅人都可以打開同修改即時帳本，所以只分享俾信任嘅人，亦唔好輸入敏感資料。你隨時可以喺自己部機停止同步；如需要刪除網上帳本，請經 GitHub 聯絡我哋。',
        ],
      },
      { h: '分享連結同 QR code', p: ['普通分享連結本身已包含帳本嘅壓縮副本，唔會上載去任何地方，但收到連結嘅人可以睇到內容。'] },
      {
        h: '第三方服務',
        p: ['當你用其他貨幣記帳，App 會由 open.er-api.com 下載匯率；同所有網站一樣，該服務可以見到你嘅 IP 地址。', '「支持我哋」按鈕會打開 Ko-fi，佢有自己嘅私隱政策。', '網站由 GitHub Pages 託管，可能會保留一般伺服器記錄。'],
      },
      { h: 'Cookie 同追蹤', p: ['夾錢易唔使用 cookie、廣告或者任何追蹤。'] },
      { h: '聯絡', p: [`有問題或要求：請到 ${REPO}/issues 開 issue。`] },
    ],
  },
  terms: {
    title: '使用條款',
    description: '使用免費夾錢計算機「夾錢易」嘅條款。',
    sections: [
      { p: [`最後更新：${UPDATED}`, '使用夾錢易即表示你同意以下條款。'] },
      {
        h: '只供參考',
        p: ['App 顯示嘅服務費、稅、貼士習慣同匯率屬一般參考數值，可能已過時或因城市、州份同餐廳而異。請以收據同實際匯率為準。', '俾錢或者叫人俾錢之前，請自行核對金額。'],
      },
      { h: '免責', p: ['夾錢易以「現況」免費提供，不作任何保證。在法律允許範圍內，我哋對使用本 App 引致嘅任何損失（包括資料遺失）概不負責。'] },
      { h: '你嘅內容', p: ['你輸入嘅內容屬於你。請勿利用即時共享儲存違法內容，或未經同意儲存他人嘅個人資料。'] },
      { h: '修訂', p: ['我哋可能會更新 App 同本條款，以上日期為最新版本。'] },
    ],
  },
  about: {
    title: '關於夾錢易',
    description: '夾錢易（EasySplit）係一個免費、重視私隱嘅夾錢計算機，適用於全世界嘅食飯、聚會同旅行。',
    sections: [
      {
        p: ['夾錢易源於香港——「加一」令每次埋單都變成數學題。後來發展成適用於全世界食飯、聚會同旅行嘅夾錢工具。', '佢識得 30 幾個國家常見嘅服務費、稅同貼士習慣，支援任何貨幣，仲會計出最少嘅轉帳次數。'],
      },
      { h: '原則', p: ['免費、冇廣告、唔使註冊、離線都用到。除非你自己開啟即時共享，否則資料只會留喺你部機。'] },
      { h: '支持', p: [`夾錢易係業餘項目。如果幫到你同朋友，歡迎喺 Ko-fi 支持：${KOFI_URL}`] },
      { h: '意見', p: [`發現稅率唔啱或者有 bug？請到 ${REPO}/issues 話俾我哋知。`] },
    ],
  },
};

const zhCN: Record<LegalKind, LegalPage> = {
  privacy: {
    title: '隐私政策',
    description: '夹钱易如何处理你的数据：账本只存在你的设备上、不追踪、实时共享需你自行开启。',
    sections: [
      { p: [`最后更新：${UPDATED}`, '夹钱易是一款免费的 AA 计算器，无需注册，也不需要你的个人数据。'] },
      {
        h: '保存在你设备上的数据',
        p: ['你输入的名字、金额和账本只保存在你设备浏览器的本地存储（local storage）中，不会发送给我们。', '你可随时在「设置 → 备份」下载备份文件；清除浏览器的网站数据即可删除全部内容。'],
      },
      {
        h: '实时共享（可选）',
        p: [
          '如果你为某个账本开启实时共享，该账本（名称、成员名、你填写的收款信息和支出）会保存在 Google Firebase（Cloud Firestore），以便收到链接的朋友实时查看和编辑。',
          '任何持有链接的人都能打开和修改实时账本，请只分享给信任的人，也不要输入敏感信息。你可以随时在自己的设备上停止同步；如需删除在线账本，请通过 GitHub 联系我们。',
        ],
      },
      { h: '分享链接和二维码', p: ['普通分享链接本身包含账本的压缩副本，不会上传到任何地方，但收到链接的人可以查看内容。'] },
      {
        h: '第三方服务',
        p: ['当你用其他货币记账时，应用会从 open.er-api.com 下载汇率；和所有网站一样，该服务可以看到你的 IP 地址。', '「支持我们」按钮会打开 Ko-fi，其有自己的隐私政策。', '网站托管于 GitHub Pages，可能会保留一般服务器日志。'],
      },
      { h: 'Cookie 与追踪', p: ['夹钱易不使用 cookie、广告或任何追踪。'] },
      { h: '联系', p: [`如有问题或请求：请在 ${REPO}/issues 提交 issue。`] },
    ],
  },
  terms: {
    title: '使用条款',
    description: '使用免费 AA 计算器「夹钱易」的条款。',
    sections: [
      { p: [`最后更新：${UPDATED}`, '使用夹钱易即表示你同意以下条款。'] },
      {
        h: '仅供参考',
        p: ['应用显示的服务费、税、小费习惯和汇率为一般参考值，可能已过时或因城市、州和餐厅而异。请以账单和实际汇率为准。', '付款或请别人付款前，请自行核对金额。'],
      },
      { h: '免责声明', p: ['夹钱易按「现状」免费提供，不作任何保证。在法律允许的范围内，我们对使用本应用造成的任何损失（包括数据丢失）不承担责任。'] },
      { h: '你的内容', p: ['你输入的内容归你所有。请勿利用实时共享存储违法内容，或未经同意存储他人的个人信息。'] },
      { h: '修订', p: ['我们可能会更新应用和本条款，上方日期为最新版本。'] },
    ],
  },
  about: {
    title: '关于夹钱易',
    description: '夹钱易（EasySplit）是一款免费、注重隐私的 AA 计算器，适用于全球的聚餐、聚会和旅行。',
    sections: [
      {
        p: ['夹钱易源于香港——10% 服务费让每次结账都像做数学题。后来发展成适用于全球聚餐、聚会和旅行的 AA 工具。', '它了解 30 多个国家常见的服务费、税和小费习惯，支持任何货币，还能算出最少的转账次数。'],
      },
      { h: '原则', p: ['免费、无广告、无需注册、离线可用。除非你主动开启实时共享，数据只保存在你的设备上。'] },
      { h: '支持', p: [`夹钱易是业余项目。如果对你和朋友有帮助，欢迎在 Ko-fi 支持：${KOFI_URL}`] },
      { h: '反馈', p: [`发现税率不对或有 bug？请在 ${REPO}/issues 告诉我们。`] },
    ],
  },
};

export const LEGAL: Partial<Record<LangCode, Record<LegalKind, LegalPage>>> = { en, 'zh-HK': zhHK, 'zh-CN': zhCN };
