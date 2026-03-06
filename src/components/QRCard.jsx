import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Phone } from 'lucide-react';

const QRCard = forwardRef(({ studentData, logo }, ref) => {
    const { name, phone, idNo } = studentData;

    // Ethiopian Geometric Pattern (SVG String for repeating background)
    const borderPattern = `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L10 0 L20 10 L10 20 Z M20 10 L30 0 L40 10 L30 20 Z' fill='none' stroke='%23d3a200' stroke-width='2'/%3E%3C/svg%3E")`;

    return (
        <div
            ref={ref}
            style={{
                width: '400px',
                height: '650px',
                backgroundColor: '#fffdf7',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: '1px solid #65081b',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Top Section (42%) */}
            <div style={{
                height: '42%',
                backgroundColor: '#65081b',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 20px',
                zIndex: 1 // Ensure top section is above background but below QR shadow
            }}>
                {/* Decorative Circles/Blobs */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '50%' }} />

                {/* Top Gold Border */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '12px',
                    backgroundImage: borderPattern,
                    backgroundRepeat: 'repeat-x'
                }} />

                {/* Logo Image */}
                <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                    <img
                        src={logo || "/logo.png"}
                        alt="Logo"
                        style={{ width: '85px', height: '85px', objectFit: 'contain' }}
                        onError={(e) => { e.target.src = "https://placehold.co/85x85/65081b/d3a200?text=Logo"; }}
                    />
                </div>

                {/* Organization Name */}
                <h3 style={{
                    color: '#d3a200',
                    fontSize: '16px',
                    marginBottom: '2px',
                    fontWeight: '700',
                    textAlign: 'center'
                }}>የኢትዮጵያዊው ጀንባ ትውልድ</h3>

                {/* Single line Amharic Title - Prevent hiding behind QR */}
                <h1 style={{
                    color: '#d3a200',
                    fontSize: '20px', // Adjusted for single line
                    textAlign: 'center',
                    fontWeight: '900',
                    lineHeight: '1.2',
                    marginTop: '2px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap', // Force single line
                    width: '100%'
                }}>የቅድመ ጋብቻ ትምህርት</h1>

                {/* QR Code Container - Lifted more to show full box */}
                <div style={{
                    position: 'absolute',
                    bottom: '-40px', // Lifted slightly more
                    backgroundColor: '#fff',
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    zIndex: 20,
                    border: '1.5px solid #d3a200'
                }}>
                    <QRCodeSVG
                        value={JSON.stringify({ name, phone, idNo })}
                        size={110} // Reduced size slightly for better fit
                        level="H"
                        includeMargin={false} // Removed redundant margin to show more QR
                    />
                </div>
            </div>

            {/* Bottom Section (58%) */}
            <div style={{
                height: '58%',
                padding: '60px 40px 10px 40px', // Reduced top padding significantly
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                background: 'linear-gradient(45deg, #fffdf7 25%, #f9f6e5 25%, #f9f6e5 50%, #fffdf7 50%, #fffdf7 75%, #f9f6e5 75%, #f9f6e5 100%)',
                backgroundSize: '20px 20px'
            }}>
                {/* Subtle Diagonal Lines Watermark */}
                <div style={{ position: 'absolute', top: 0, left: 1, right: 0, bottom: 0, opacity: 0.05, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(45deg, #65081b, #65081b 1px, transparent 1px, transparent 10px)' }} />

                {/* Info Rows - Tighter spacing to remove whitespace */}
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', color: '#65081b', fontWeight: '800', fontSize: '13px', marginBottom: '1px' }}>Name</label>
                    <div style={{ color: '#65081b', fontSize: '22px', fontWeight: '600', borderBottom: '1px solid rgba(101, 8, 27, 0.1)' }}>{name}</div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', color: '#65081b', fontWeight: '800', fontSize: '13px', marginBottom: '1px' }}>Phone</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={18} color="#65081b" />
                        <div style={{ color: '#65081b', fontSize: '20px', fontWeight: '600' }}>{phone}</div>
                    </div>
                </div>

                {/* Spacer - Reduced to push content up */}
                <div style={{ flexGrow: 1 }} />

                {/* Bottom Decorative Border */}
                <div style={{
                    height: '10px',
                    width: '100%',
                    backgroundImage: borderPattern,
                    backgroundRepeat: 'repeat-x',
                    marginBottom: '8px'
                }} />

                {/* Footer Bar */}
                <div style={{
                    backgroundColor: '#65081b',
                    margin: '0 -40px -10px -40px',
                    padding: '12px 20px',
                    color: '#d3a200',
                    fontSize: '11px',
                    textAlign: 'center',
                    fontWeight: '700'
                }}>
                    Valid Until end of course
                </div>
            </div>


        </div>
    );
});

export default QRCard;
