import type { OrderStatus } from "@/lib/constants/order";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";

/**
 * What the bot says to customers, in the language they shopped in. Owner
 * messages are not here: the owner always reads Ukrainian.
 */
export type CustomerTexts = {
  thanks: string; // "Дякуємо, {name}! Замовлення №{number}"
  introNew: string;
  status: string;
  itemsTotal: string;
  delivery: string;
  payment: string;
  bankTitle: string;
  bankPurpose: string; // "…: замовлення №{number}"
  receiptAsk: string;
  receiptReceived: string;
  receiptNoOrder: string;
  statuses: Partial<Record<OrderStatus, string>>;
  welcome: string;
  orderLinkInvalid: string;
  orderLinkTaken: string;
  help: string; // "…: {phone}"
  helpNoPhone: string;
};

const uk: CustomerTexts = {
  thanks: "Дякуємо, {name}! Замовлення №{number}",
  introNew:
    "Ми отримали ваше замовлення й зателефонуємо, щоб його підтвердити. Тут ви отримуватимете оновлення статусу.",
  status: "Статус",
  itemsTotal: "Разом за товари",
  delivery: "Доставка",
  payment: "Оплата",
  bankTitle: "Реквізити для оплати",
  bankPurpose: "У призначенні платежу вкажіть: замовлення №{number}",
  receiptAsk:
    "Після оплати надішліть, будь ласка, фото або скриншот квитанції в цей чат — так ми швидше підтвердимо оплату.",
  receiptReceived:
    "Дякуємо! Квитанцію отримали. Перевіримо оплату й повідомимо тут, щойно її підтвердимо.",
  receiptNoOrder:
    "Не знайшли замовлення, яке очікує оплати. Якщо ви вже оплатили — зателефонуйте нам: {phone}",
  statuses: {
    confirmed: "Замовлення підтверджено ✅",
    payment_pending: "Очікуємо на оплату.",
    paid: "Дякуємо, оплату отримано! 💛 Відправимо ваше замовлення якнайшвидше й повідомимо тут, щойно воно буде в дорозі.",
    processing: "Готуємо замовлення до відправки.",
    shipped: "Замовлення відправлено 🚚",
    delivered: "Замовлення доставлено. Дякуємо, що обрали PONTOS!",
    cancelled:
      "Замовлення скасовано. Якщо це помилка — напишіть або зателефонуйте нам.",
  },
  welcome:
    "Вітаємо в PONTOS! 👋\nЦей бот надсилає підтвердження та статус замовлень. Щоб підключити замовлення, натисніть кнопку «Отримати підтвердження в Telegram» після оформлення на сайті.",
  orderLinkInvalid:
    "Не вдалося знайти це замовлення. Відкрийте посилання з сайту ще раз або зв’яжіться з нами.",
  orderLinkTaken:
    "Це замовлення вже підключене до іншого чату. Якщо це ваше замовлення — зв’яжіться з нами.",
  help: "Питання щодо замовлення? Зателефонуйте нам: {phone}",
  helpNoPhone:
    "Питання щодо замовлення? Напишіть нам через сайт — кнопка «Контакти».",
};

const ru: CustomerTexts = {
  thanks: "Спасибо, {name}! Заказ №{number}",
  introNew:
    "Мы получили ваш заказ и позвоним, чтобы его подтвердить. Здесь вы будете получать обновления статуса.",
  status: "Статус",
  itemsTotal: "Итого за товары",
  delivery: "Доставка",
  payment: "Оплата",
  bankTitle: "Реквизиты для оплаты",
  bankPurpose: "В назначении платежа укажите: заказ №{number}",
  receiptAsk:
    "После оплаты отправьте, пожалуйста, фото или скриншот квитанции в этот чат — так мы быстрее подтвердим оплату.",
  receiptReceived:
    "Спасибо! Квитанцию получили. Проверим оплату и сообщим здесь, как только её подтвердим.",
  receiptNoOrder:
    "Не нашли заказ, ожидающий оплаты. Если вы уже оплатили — позвоните нам: {phone}",
  statuses: {
    confirmed: "Заказ подтверждён ✅",
    payment_pending: "Ожидаем оплату.",
    paid: "Спасибо, оплата получена! 💛 Отправим ваш заказ как можно скорее и сообщим здесь, как только он будет в пути.",
    processing: "Готовим заказ к отправке.",
    shipped: "Заказ отправлен 🚚",
    delivered: "Заказ доставлен. Спасибо, что выбрали PONTOS!",
    cancelled:
      "Заказ отменён. Если это ошибка — напишите или позвоните нам.",
  },
  welcome:
    "Добро пожаловать в PONTOS! 👋\nЭтот бот присылает подтверждения и статус заказов. Чтобы подключить заказ, нажмите кнопку «Получить подтверждение в Telegram» после оформления на сайте.",
  orderLinkInvalid:
    "Не удалось найти этот заказ. Откройте ссылку с сайта ещё раз или свяжитесь с нами.",
  orderLinkTaken:
    "Этот заказ уже подключён к другому чату. Если это ваш заказ — свяжитесь с нами.",
  help: "Вопрос по заказу? Позвоните нам: {phone}",
  helpNoPhone:
    "Вопрос по заказу? Напишите нам через сайт — кнопка «Контакты».",
};

const en: CustomerTexts = {
  thanks: "Thank you, {name}! Order No. {number}",
  introNew:
    "We have received your order and will call you to confirm it. You will get status updates here.",
  status: "Status",
  itemsTotal: "Items total",
  delivery: "Delivery",
  payment: "Payment",
  bankTitle: "Payment details",
  bankPurpose: "Payment reference: order No. {number}",
  receiptAsk:
    "Once you have paid, please send a photo or screenshot of the receipt to this chat so we can confirm your payment faster.",
  receiptReceived:
    "Thank you! We have received your receipt. We will check the payment and let you know here as soon as it is confirmed.",
  receiptNoOrder:
    "We could not find an order awaiting payment. If you have already paid, please call us: {phone}",
  statuses: {
    confirmed: "Order confirmed ✅",
    payment_pending: "Awaiting your payment.",
    paid: "Thank you, payment received! 💛 We will ship your order as soon as possible and let you know here once it is on its way.",
    processing: "Preparing your order for shipping.",
    shipped: "Your order has been shipped 🚚",
    delivered: "Your order has been delivered. Thank you for choosing PONTOS!",
    cancelled:
      "Your order has been cancelled. If this is a mistake, please message or call us.",
  },
  welcome:
    "Welcome to PONTOS! 👋\nThis bot sends order confirmations and status updates. To connect an order, press “Get confirmation in Telegram” after checking out on the site.",
  orderLinkInvalid:
    "We could not find this order. Open the link from the site again or contact us.",
  orderLinkTaken:
    "This order is already connected to another chat. If it is your order, please contact us.",
  help: "A question about your order? Call us: {phone}",
  helpNoPhone:
    "A question about your order? Message us through the site — the “Contacts” button.",
};

const TEXTS: Record<Locale, CustomerTexts> = { uk, ru, en };

export function customerTexts(locale: Locale): CustomerTexts {
  return TEXTS[locale];
}

/** Telegram's `language_code` ("ru", "en-GB"…) → a storefront language. */
export function localeFromTelegram(languageCode?: string | null): Locale {
  const base = languageCode?.split("-")[0]?.toLowerCase();
  return isLocale(base) ? base : DEFAULT_LOCALE;
}
