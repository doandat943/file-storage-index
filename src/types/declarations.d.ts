// CSS modules
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// Plyr CSS direct import
declare module 'plyr/dist/plyr.css'; 