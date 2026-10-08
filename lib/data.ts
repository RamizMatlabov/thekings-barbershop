export const navLinks = [
  { href: '#home', label: 'Главная' },
  { href: '#about', label: 'О нас' },
  { href: '#services', label: 'Услуги' },
  { href: '#gallery', label: 'Галерея' },
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

export type GalleryCategory = 'haircut' | 'beard' | 'shave' | 'interior' | 'details'

export const galleryFilters: { id: 'all' | GalleryCategory; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'haircut', label: 'Стрижки' },
  { id: 'beard', label: 'Борода' },
  { id: 'shave', label: 'Бритьё' },
  { id: 'interior', label: 'Интерьер' },
  { id: 'details', label: 'Детали' },
]

export const galleryItems: { src: string; alt: string; category: GalleryCategory }[] = [
  { src: '/images/barber-work.png', alt: 'Барбер делает стрижку клиенту', category: 'haircut' },
  { src: '/images/service-haircut.png', alt: 'Мужская стрижка с фейдом', category: 'haircut' },
  { src: '/images/tools.png', alt: 'Инструменты барбера', category: 'details' },
  { src: '/images/service-shave.png', alt: 'Классическое бритьё опасной бритвой', category: 'shave' },
  { src: '/images/hero.png', alt: 'Интерьер барбершопа', category: 'interior' },
  { src: '/images/service-beard.png', alt: 'Оформление бороды', category: 'beard' },
  { src: '/images/about.png', alt: 'Кресло барбера', category: 'interior' },
  { src: '/images/products.png', alt: 'Средства для ухода', category: 'details' },
  { src: '/images/interior-2.png', alt: 'Зеркала и лампы в зале', category: 'interior' },
  { src: '/images/barber-3.png', alt: 'Ухоженная борода', category: 'beard' },
  { src: '/images/service-styling.png', alt: 'Укладка волос', category: 'haircut' },
]

export function formatPrice(service: Pick<Service, 'price' | 'priceFrom'>) {
  const value = service.price.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
  return `${service.priceFrom ? 'от ' : ''}${value} сум`
}

export const SELECT_SERVICE_EVENT = 'kings:select-service'
