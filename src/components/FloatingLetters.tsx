import { motion } from 'framer-motion';

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export default function FloatingLetters() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
            {letters.map((letter, i) => (
                <motion.div
                    key={i}
                    className="absolute font-english font-bold text-6xl text-blue-900"
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        opacity: 0,
                    }}
                    animate={{
                        y: [Math.random() * 100, Math.random() * -100],
                        x: [Math.random() * 100, Math.random() * -100],
                        opacity: [0, 1, 0],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 5,
                    }}
                >
                    {letter}
                </motion.div>
            ))}
        </div>
    );
}
