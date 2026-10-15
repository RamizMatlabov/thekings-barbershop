import { About } from '@/components/site/about'
import { Booking } from '@/components/site/booking'
import { Contacts } from '@/components/site/contacts'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { Hero } from '@/components/site/hero'
import { WhyUs } from '@/components/site/why-us'

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <WhyUs />
        <Booking />
        <Contacts />
      </main>
      <Footer />
    </>
  )
}
