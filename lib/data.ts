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
    id: 'haircut-beard',
    title: 'Стрижка + борода',
    description: 'Стрижка и оформление бороды',
    price: 100000,
    duration: 60,
    image: '/images/service-beard.png',
  },
  {
    id: 'beard',
    title: 'Оформление бороды',
    description: 'Стрижка и уход за бородой',
    price: 50000,
    duration: 30,
    image: '/images/barber-3.png',
  },
  {
    id: 'shave',
    title: 'Классическое бритьё',
    description: 'Традиционное бритьё опасной бритвой',
    price: 50000,
    duration: 30,
    image: '/images/service-shave.png',
  },
  {
    id: 'styling',
    title: 'Укладка',
    description: 'Укладка и стайлинг волос',
    price: 50000,
    duration: 30,
    image: '/images/service-styling.png',
  },
  {
    id: 'care',
    title: 'Уход за волосами',
    description: 'Профессиональный уход за волосами',
    price: 20000,
    priceFrom: true,
    duration: 30,
    image: '/images/barber-work.png',
  },
]

export const barbers = [
  { id: 'alexey', name: 'Алексей', role: 'Топ-барбер', experience: 'Опыт: 6 лет', image: '/images/barber-1.png' },
  { id: 'dmitry', name: 'Дмитрий', role: 'Барбер', experience: 'Опыт: 4 года', image: '/images/barber-2.png' },
  { id: 'artem', name: 'Артём', role: 'Барбер', experience: 'Опыт: 3 года', image: '/images/barber-3.png' },
  { id: 'ivan', name: 'Иван', role: 'Барбер', experience: 'Опыт: 5 лет', image: '/images/barber-4.png' },
]

export function formatPrice(service: Pick<Service, 'price' | 'priceFrom'>) {
  const value = service.price.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
  return `${service.priceFrom ? 'от ' : ''}${value} сум`
}

export const SELECT_SERVICE_EVENT = 'kings:select-service'
