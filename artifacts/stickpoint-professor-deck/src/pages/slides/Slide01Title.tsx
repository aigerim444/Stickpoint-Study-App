const base = import.meta.env.BASE_URL;

export default function Slide01Title() {
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <img
        src={`${base}hero.jpg`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, rgba(15,29,58,0.93) 0%, rgba(15,29,58,0.80) 50%, rgba(15,29,58,0.52) 100%)',
        }}
      />
      <div
        className="relative z-10 flex flex-col justify-between h-full"
        style={{ padding: '7vh 8vw' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw' }}>
          <div style={{ width: '2.5vw', height: '2px', backgroundColor: '#C97A0E' }} />
          <span
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '1.05vw',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#C97A0E',
            }}
          >
            FOR ACADEMIC REVIEW
          </span>
        </div>

        <div>
          <h1
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '7.5vw',
              fontWeight: 400,
              color: '#FFFFFF',
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Stickpoint
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '2vw',
              color: 'rgba(255,255,255,0.78)',
              fontWeight: 400,
              marginTop: '2.5vh',
              maxWidth: '52vw',
              lineHeight: 1.5,
            }}
          >
            An evidence-based study app built on 8 peer-reviewed learning strategies
          </p>
          <div style={{ display: 'flex', gap: '4vw', marginTop: '4.5vh' }}>
            <div style={{ borderLeft: '3px solid #C97A0E', paddingLeft: '1.2vw' }}>
              <div
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '1.1vw',
                  color: 'rgba(255,255,255,0.52)',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                }}
              >
                AUDIENCE
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '1.55vw',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  marginTop: '0.5vh',
                }}
              >
                Educational Psychologists
              </div>
            </div>
            <div style={{ borderLeft: '3px solid #C97A0E', paddingLeft: '1.2vw' }}>
              <div
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '1.1vw',
                  color: 'rgba(255,255,255,0.52)',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                }}
              >
                PURPOSE
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '1.55vw',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  marginTop: '0.5vh',
                }}
              >
                Research citation review
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '1.05vw',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
          }}
        >
          8 METHODS · 12 SLIDES
        </div>
      </div>
    </div>
  );
}
