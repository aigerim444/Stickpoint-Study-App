export default function Slide12Closing() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: '#0F1D3A' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: '#C97A0E',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '8vh 8vw 7vh 8vw',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '1.05vw',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#C97A0E',
              marginBottom: '2vh',
            }}
          >
            FEEDBACK WELCOME
          </div>
          <h2
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '4.5vw',
              fontWeight: 400,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.1,
              maxWidth: '70vw',
            }}
          >
            Questions and fact-checking
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5vh', maxWidth: '68vw' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5vw' }}>
            <div
              style={{
                width: '0.55vw',
                height: '0.55vw',
                borderRadius: '50%',
                backgroundColor: '#C97A0E',
                marginTop: '0.9vh',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1.75vw',
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.55,
              }}
            >
              We would welcome any corrections to the citations, effect sizes, or implementation choices
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5vw' }}>
            <div
              style={{
                width: '0.55vw',
                height: '0.55vw',
                borderRadius: '50%',
                backgroundColor: '#C97A0E',
                marginTop: '0.9vh',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1.75vw',
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.55,
              }}
            >
              These methods and evidence are drawn from published peer-reviewed research — but we are not cognitive psychologists
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5vw' }}>
            <div
              style={{
                width: '0.55vw',
                height: '0.55vw',
                borderRadius: '50%',
                backgroundColor: '#C97A0E',
                marginTop: '0.9vh',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1.75vw',
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.55,
              }}
            >
              If any method is mis-described, over-claimed, or applied inconsistently with the research, please let us know — we will update the app
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: '2.5vh',
          }}
        >
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '1.8vw',
              color: '#FFFFFF',
              fontWeight: 400,
            }}
          >
            Stickpoint
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '1.55vw',
              color: '#C97A0E',
              fontWeight: 500,
            }}
          >
            [your email]
          </span>
        </div>
      </div>
    </div>
  );
}
