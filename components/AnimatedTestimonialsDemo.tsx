import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export function AnimatedTestimonialsDemo() {
  const testimonials = [
    {
      quote:
        "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
      name: "Prasanth",
      designation: "FullStack-Developer",
      src: "/Prasanth.jpeg",
    },
    {
      quote:
        "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
      name: "Prannavakhanth",
      designation: "AIML Member",
      src: "/Prannavakhanth.jpg",
    },
    {
      quote:
        "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple.",
      name: "Hariprasaadh",
      designation: "AIML Member",
      src: "/Hariprasaadh.jpg",
    },
    {
      quote:
        "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
      name: "venkatakrishnan",
      designation: "Front-end developer",
      src: "/venkatakrishnan.jpeg",
    },
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
}
