//= =============================================================================================================
// Scroll back to top
const scrollButton = document.getElementById('scroll-button')
document.addEventListener(
  'scroll',
  () => {
    scrollButton.classList.toggle('visible', window.scrollY >= 100)
  },
  { passive: true },
)

// const scrollButton = document.getElementById('scroll-button')

// const observer = new IntersectionObserver(
//   (entries) => {
//     entries.forEach((entry) => {
//       scrollButton.classList.toggle('visible', !entry.isIntersecting)
//     })
//   },
//   {
//     threshold: 0,
//   },
// )

// observer.observe(document.body)
