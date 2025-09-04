export default function ShareNotionLayout(props: React.PropsWithChildren) {
  return (
    <>
      {/* Global styles injected at SSR to avoid initial flash */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header, footer { display: none !important; }
            body.bg-decoration { background: none !important; }
            /* Remove outer paddings/max-width added by root layout for this share page */
            html, body { margin: 0 !important; padding: 0 !important; }
            body > div { 
              padding-left: 0 !important; 
              padding-right: 0 !important; 
              margin: 0 !important; 
              max-width: none !important; 
              min-width: 0 !important; 
              width: 100% !important;
            }
          `,
        }}
      />
      {props.children}
    </>
  )
}
