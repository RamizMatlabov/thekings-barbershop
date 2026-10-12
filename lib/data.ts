export const navLinks = [
  { href: '#home', label: 'Главная' },
  { href: '#about', label: 'О нас' },
  { href: '#services', label: 'Услуги' },
  { href: '#booking', label: 'Прайс' },
  { href: '#contacts', label: 'Контакты' },
]

export type Service = {
  id: string
  title: string
  description: string
  price: number
  priceMax?: number
  priceFrom?: boolean
  duration: number
  image: string
}

export const services: Service[] = [
  {
    id: 'haircut',
    title: 'Мужская стрижка',
    description: 'Классическая или модная стрижка',
    price: 70000,
    duration: 45,
    image: '/images/service-haircut.png',
  },
  {
    id: 'kids-haircut',
    title: 'Детская стрижка (до 14 лет)',
    description: 'Стрижка для детей до 14 лет',
    price: 50000,
    duration: 30,
    image: '/images/barber-work.png',
  },
  {
    id: 'clipper',
    title: 'Под насадку',
    description: 'Стрижка машинкой под насадку',
    price: 30000,
    priceMax: 40000,
    duration: 25,
    image: '/images/tools.png',
  },
  {
    id: 'beard',
    title: 'Стрижка бороды',
    description: 'Стрижка и оформление бороды',
    price: 50000,
    duration: 30,
    image: '/images/service-beard.png',
  },
  {
    id: 'styling',
    title: 'Укладка волос',
    description: 'Укладка и стайлинг волос',
    price: 40000,
    duration: 30,
    image: '/images/service-styling.png',
  },
  {
    id: 'edging',
    title: 'Окантовка',
    description: 'Аккуратная окантовка контуров',
    price: 20000,
    priceMax: 30000,
    duration: 15,
    image: '/images/service-shave.png',
  },
  {
    id: 'mask',
    title: 'Маска',
    description: 'Уходовая маска для лица или волос',
    price: 30000,
    priceMax: 40000,
    duration: 30,
    image: '/images/products.png',
  },
  {
    id: 'wax',
    title: 'Воск',
    description: 'Укладка воском',
    price: 10000,
    priceMax: 15000,
    duration: 15,
    image: '/images/barber-3.png',
  },
  {
    id: 'hair-color',
    title: 'Краска волос',
    description: 'Окрашивание волос',
    price: 40000,
    duration: 45,
    image: '/images/barber-4.png',
  },
  {
    id: 'beard-color',
    title: 'Краска бороды',
    description: 'Окрашивание бороды',
    price: 30000,
    duration: 30,
    image: '/images/service-beard.png',
  },
  {
    id: 'wedding',
    title: 'Свадебные причёски',
    description: 'Свадебная укладка и причёска',
    price: 400000,
    duration: 120,
    image: '/images/about.png',
  },
]

export const barbers = [
  { id: 'amir', name: 'Пардакулов Амир', role: 'Барбер', experience: 'Опыт: 4 лет', image: '/images/barber1.png' },
  { id: 'daler', name: 'Хамидов Далер', role: 'Барбер', experience: 'Опыт: 14 лет', image: '/images/barber2.png' },
]

function formatAmount(value: number) {
  return value.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
}

export function formatPrice(service: Pick<Service, 'price' | 'priceFrom' | 'priceMax'>) {
  if (service.priceMax != null && service.priceMax !== service.price) {
    return `${formatAmount(service.price)} – ${formatAmount(service.priceMax)} сум`
  }
  return `${service.priceFrom ? 'от ' : ''}${formatAmount(service.price)} сум`
}

export const SELECT_SERVICE_EVENT = 'kings:select-service'
