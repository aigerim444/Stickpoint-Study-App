export default function Slide11Algorithm() {
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
            PERSONALISATION
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
            The recommendation algorithm
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '5vw', flex: 1, minHeight: 0 }}>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '2.5vh' }}>
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1vw',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#6B7280',
                marginBottom: '0.5vh',
              }}
            >
              HOW SCORING WORKS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
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
                    fontSize: '1.55vw',
                    color: '#1C1B2E',
                    lineHeight: 1.55,
                  }}
                >
                  Each quiz answer awards weighted points to one or more methods
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
                    fontSize: '1.55vw',
                    color: '#1C1B2E',
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
                    fontSize: '1.55vw',
                    color: '#1C1B2E',
                    lineHeight: 1.55,
                  }}
                >
                  The top 3 scoring methods become the student's personalised starting point
                </span>
              </div>
            </div>
          </div>

          <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '1vw',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#6B7280',
                marginBottom: '2vh',
              }}
            >
              SUBJECT BONUSES AND PENALTIES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#0F1D3A',
                  padding: '1.2vh 1.5vw',
                }}
              >
                <div style={{ flex: '1', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.1vw', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.08em' }}>SUBJECT</div>
                <div style={{ flex: '1.6', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.1vw', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.08em' }}>BOOSTED METHODS</div>
                <div style={{ flex: '1.2', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.1vw', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.08em' }}>PENALISED</div>
              </div>
              <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: '1.4vh 1.5vw', borderBottom: '1px solid #E5E2DC' }}>
                <div style={{ flex: '1', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.4vw', color: '#1C1B2E', fontWeight: 600 }}>Math / Science</div>
                <div style={{ flex: '1.6', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Problem Sets, Practice Testing, Active Recall</div>
                <div style={{ flex: '1.2', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Blurting, Self-Explanation</div>
              </div>
              <div style={{ display: 'flex', backgroundColor: '#F9F8F5', padding: '1.4vh 1.5vw', borderBottom: '1px solid #E5E2DC' }}>
                <div style={{ flex: '1', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.4vw', color: '#1C1B2E', fontWeight: 600 }}>History / Humanities</div>
                <div style={{ flex: '1.6', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Feynman, Elaborative Interrogation, Blurting</div>
                <div style={{ flex: '1.2', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Problem Sets</div>
              </div>
              <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: '1.4vh 1.5vw', borderBottom: '1px solid #E5E2DC' }}>
                <div style={{ flex: '1', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.4vw', color: '#1C1B2E', fontWeight: 600 }}>Language</div>
                <div style={{ flex: '1.6', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Active Recall, Blurting, Self-Explanation</div>
                <div style={{ flex: '1.2', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Problem Sets</div>
              </div>
              <div style={{ display: 'flex', backgroundColor: '#F9F8F5', padding: '1.4vh 1.5vw', borderBottom: '1px solid #E5E2DC' }}>
                <div style={{ flex: '1', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.4vw', color: '#1C1B2E', fontWeight: 600 }}>English / Writing</div>
                <div style={{ flex: '1.6', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Feynman, Elaborative Interrogation, Blurting</div>
                <div style={{ flex: '1.2', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.35vw', color: '#4A5568' }}>Problem Sets</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
