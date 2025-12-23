import { BookText, Briefcase, MessageCircle, FileText, GraduationCap, Globe2 } from 'lucide-react';

const services = [
  {
    icon: GraduationCap,
    title: 'General English Courses',
    description: 'Comprehensive English language training for all levels, from beginner to advanced.',
    features: ['Grammar & Vocabulary', 'Reading & Writing', 'Listening Skills', 'Speaking Practice']
  },
  {
    icon: Briefcase,
    title: 'Business English',
    description: 'Professional English for career advancement, presentations, and workplace communication.',
    features: ['Business Vocabulary', 'Email Writing', 'Presentations', 'Negotiations']
  },
  {
    icon: BookText,
    title: 'Exam Preparation',
    description: 'Specialized coaching for IELTS, TOEFL, and other English proficiency exams.',
    features: ['Practice Tests', 'Strategy Tips', 'Score Improvement', 'Mock Exams']
  },
  {
    icon: MessageCircle,
    title: 'Conversation Classes',
    description: 'Improve your fluency and confidence through engaging conversation practice.',
    features: ['Daily Topics', 'Pronunciation', 'Idioms & Phrases', 'Real-Life Scenarios']
  },
  {
    icon: FileText,
    title: 'Translation Services',
    description: 'Professional English-Arabic translation for documents, articles, and content.',
    features: ['Document Translation', 'Content Localization', 'Proofreading', 'Quality Assurance']
  },
  {
    icon: Globe2,
    title: 'Online & In-Person',
    description: 'Flexible learning options to fit your schedule and preferences.',
    features: ['One-on-One Sessions', 'Group Classes', 'Online Platforms', 'Custom Schedule']
  }
];

export default function Services() {
  return (
    <section id="services" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Services Offered</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive English language services designed to meet your unique learning goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <service.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

              <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-700">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="#contact"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Book Your First Session
          </a>
        </div>
      </div>
    </section>
  );
}
