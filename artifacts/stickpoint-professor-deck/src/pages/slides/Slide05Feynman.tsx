export default function Slide05Feynman() {
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ backgroundColor: '#F5F3EF' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '27vh',
          backgroundColor: '#0F1D3A',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 7vw 3.5vh',
        }}
      >
        <div
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '1vw',
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: '#C97A0E',
            marginBottom: '1.2vh',
          }}
        >
          DEEP PROCESSING
        </div>
        <h2
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '4.2vw',
            fontWeight: 400,
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Feynman Technique
        </h2>
        <div
          style={{
            position: 'absolute',
            top: '3.5vh',
            right: '7vw',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '1.05vw',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em',
          }}
        >
          3 / 8
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '27vh',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '4.5vh 7vw 4vh',
          display: 'flex',
          gap: '4vw',
        }}
      >
        <div style={{ flex: '1.1', display: 'flex', flexDirection: 'column', gap: '3vh' }}>
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1vw',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#C97A0E',
                marginBottom: '1.5vh',
              }}
            >
              RESEARCH EVIDENCE
            </div>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid #C97A0E',
                padding: '2.5vh 2vw',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2vh',
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '1.45vw',
                  fontStyle: 'italic',
                  color: '#6B7280',
                  lineHeight: 1.5,
                }}
              >
                Craik &amp; Lockhart (1972)
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '1.6vw',
                  fontWeight: 700,
                  color: '#1C1B2E',
                  lineHeight: 1.5,
                }}
              >
                Elaborative encoding produces far more durable memories than shallow re-exposure.
              </div>
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1vw',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#0F1D3A',
                marginBottom: '1.5vh',
              }}
            >
              UNDERLYING PRINCIPLE
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1.7vw',
                color: '#1C1B2E',
                lineHeight: 1.55,
              }}
            >
              Explaining simply forces the learner to identify and close gaps.
            </div>
          </div>
        </div>

        <div style={{ flex: '0.9', display: 'flex', flexDirection: 'column', gap: '2.2vh' }}>
          <div
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '1vw',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#C97A0E',
            }}
          >
            IN THE APP
          </div>
          <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '0.55vw',
                height: '0.55vw',
                borderRadius: '50%',
                backgroundColor: '#C97A0E',
                marginTop: '0.8vh',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1.6vw',
                color: '#1C1B2E',
                lineHeight: 1.55,
              }}
            >
              Key concepts are extracted from the student's notes
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '0.55vw',
                height: '0.55vw',
                borderRadius: '50%',
                backgroundColor: '#C97A0E',
                marginTop: '0.8vh',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1.6vw',
                color: '#1C1B2E',
                lineHeight: 1.55,
              }}
            >
              Students explain each concept as if to a 10-year-old, on a blank screen
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '0.55vw',
                height: '0.55vw',
                borderRadius: '50%',
                backgroundColor: '#C97A0E',
                marginTop: '0.8vh',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1.6vw',
                color: '#1C1B2E',
                lineHeight: 1.55,
              }}
            >
              AI scores the explanation out of 5 and surfaces the model answer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
