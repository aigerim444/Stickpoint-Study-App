export default function Slide02Quiz() {
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ backgroundColor: '#F5F3EF' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#0F1D3A' }} />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '5.5vh 7vw 5vh' }}>
        <div style={{ marginBottom: '3.5vh' }}>
          <div
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '1vw',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#C97A0E',
              marginBottom: '1vh',
            }}
          >
            ONBOARDING QUIZ
          </div>
          <h2
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '4vw',
              fontWeight: 400,
              color: '#0F1D3A',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            How students are matched
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '5vw', flex: 1, minHeight: 0 }}>
          <div style={{ flex: '1.1', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1vw',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#6B7280',
                marginBottom: '2.2vh',
              }}
            >
              6 DIAGNOSTIC QUESTIONS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8vh' }}>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.8vw',
                    color: '#C97A0E',
                    lineHeight: 1.1,
                    minWidth: '1.8vw',
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '1.5vw',
                    color: '#1C1B2E',
                    lineHeight: 1.5,
                  }}
                >
                  What does studying usually look like for you right now?
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.8vw',
                    color: '#C97A0E',
                    lineHeight: 1.1,
                    minWidth: '1.8vw',
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '1.5vw',
                    color: '#1C1B2E',
                    lineHeight: 1.5,
                  }}
                >
                  What is your biggest problem when you study?
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.8vw',
                    color: '#C97A0E',
                    lineHeight: 1.1,
                    minWidth: '1.8vw',
                    flexShrink: 0,
                  }}
                >
                  3
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '1.5vw',
                    color: '#1C1B2E',
                    lineHeight: 1.5,
                  }}
                >
                  When you actually remember something weeks later, what usually helped?
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.8vw',
                    color: '#C97A0E',
                    lineHeight: 1.1,
                    minWidth: '1.8vw',
                    flexShrink: 0,
                  }}
                >
                  4
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '1.5vw',
                    color: '#1C1B2E',
                    lineHeight: 1.5,
                  }}
                >
                  Which sounds most like how you feel when you study?
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.8vw',
                    color: '#C97A0E',
                    lineHeight: 1.1,
                    minWidth: '1.8vw',
                    flexShrink: 0,
                  }}
                >
                  5
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '1.5vw',
                    color: '#1C1B2E',
                    lineHeight: 1.5,
                  }}
                >
                  How far in advance do you usually start studying for a big test?
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.8vw',
                    color: '#C97A0E',
                    lineHeight: 1.1,
                    minWidth: '1.8vw',
                    flexShrink: 0,
                  }}
                >
                  6
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '1.5vw',
                    color: '#1C1B2E',
                    lineHeight: 1.5,
                  }}
                >
                  What would make studying feel like it is actually working for you?
                </span>
              </div>
            </div>
          </div>

          <div style={{ flex: '0.9', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1vw',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#6B7280',
                marginBottom: '2.2vh',
              }}
            >
              SCORING LOGIC
            </div>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid #0F1D3A',
                padding: '3vh 2.2vw',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5vh',
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '1.55vw',
                  color: '#1C1B2E',
                  lineHeight: 1.6,
                }}
              >
                Each answer awards weighted points to one or more of the 8 study methods.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8vh' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1vw' }}>
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
                  <span
                    style={{
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: '1.45vw',
                      color: '#4A5568',
                      lineHeight: 1.55,
                    }}
                  >
                    Subject area adds a fixed bonus to matched methods
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1vw' }}>
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
                  <span
                    style={{
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: '1.45vw',
                      color: '#4A5568',
                      lineHeight: 1.55,
                    }}
                  >
                    Top 3 scoring methods become the student's recommended starting point
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1vw' }}>
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
                  <span
                    style={{
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: '1.45vw',
                      color: '#4A5568',
                      lineHeight: 1.55,
                    }}
                  >
                    Recommendations adapt over time as the student completes sessions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
