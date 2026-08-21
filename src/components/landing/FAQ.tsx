import { useState } from 'react'
import { Plus } from 'lucide-react'
import { content } from '../../data/landing-content'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="faq-section">
      <h2 className="faq-title">Common Questions</h2>
      <p className="faq-subtitle">
        Technical details for security and IT teams.
      </p>

      {content.faq.map((item, i) => (
        <div key={i} className={`faq-item${openIndex === i ? ' open' : ''}`}>
          <button className="faq-question" onClick={() => toggle(i)}>
            {item.question}
            <Plus size={18} className="faq-question-icon" />
          </button>
          <div className="faq-answer">
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
