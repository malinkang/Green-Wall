export default function ShareNotionLayout(props: React.PropsWithChildren) {
  return (
    <>
      {/* Global styles injected at SSR to avoid initial flash */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header, footer { display: none !important; }
            body.bg-decoration { background: none !important; }
          `,
        }}
      />
      {props.children}
    </>
  )
}
