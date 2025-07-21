import React from "react";

export default function Spinner1() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <section className="bg-white dark:bg-dark min-h-screen flex items-center justify-center relative px-4" style={{
        backgroundImage: 'url(https://scontent.fphs2-1.fna.fbcdn.net/v/t39.30808-6/243200384_188722393369867_4679507819729921283_n.png?_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEb96mMtAMl5vF2tOzcx0W4t67p4tBdYcq3runi0F1hysZMuTrtCUWTGKp0RAhNH4S5drM3FjiRIPJm4ZiF8A5e&_nc_ohc=XZd1sfCnx9QQ7kNvwEpoj0J&_nc_oc=AdnJYkTBSgxvtPaojfSV-lHg8biA3B7BrSZmzpijHSUyc_yMVHexuogG0Qq_F0bmr-Y&_nc_zt=23&_nc_ht=scontent.fphs2-1.fna&_nc_gid=zl24t7aB_SXblR44m5qyNg&oh=00_AfQkGxjGDUEDr-tOz2sYsg1anVDpKD46w2uzO5ngAWbzBQ&oe=68834FCE)',
        backgroundSize: 'min(45vw, 300px)',
        backgroundPosition: 'center top 25%',
        backgroundRepeat: 'no-repeat',
        animation: 'fadeInOut 3s ease-in-out infinite'
      }}>
        <style jsx>{`
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
          
          @media (max-width: 640px) {
            section {
              background-size: 85% !important;
              background-position: center top 30% !important;
            }
          }
          
          @media (max-width: 480px) {
            section {
              background-size: 95% !important;
              background-position: center top 35% !important;
            }
          }
        `}</style>
        <div className="absolute inset-0 bg-white bg-opacity-85 dark:bg-dark dark:bg-opacity-85"></div>
      <div className="flex flex-col items-center gap-6 relative z-10 max-w-xs mx-auto text-center">
        <div className="flex justify-center">
          <svg
            width="64"
            height="65"
            viewBox="0 0 48 49"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-spin w-16 h-16 sm:w-20 sm:h-20"
          >
            <circle
              cx="24"
              cy="24.5"
              r="22"
              stroke="#E5E7EB"
              strokeWidth="4"
            />
            <mask id="path-2-inside-1_2527_20912" fill="white">
              <path d="M46.0051 24.5C47.1068 24.5 48.0086 23.6053 47.9172 22.5073C47.5452 18.0426 45.9291 13.7565 43.2335 10.1448C40.139 5.9986 35.7874 2.9634 30.8274 1.4916C25.8674 0.019799 20.5646 0.190212 15.7094 1.97744C11.4802 3.53423 7.78776 6.24518 5.04079 9.78438C4.36525 10.6547 4.63305 11.8965 5.55649 12.4975C6.47993 13.0984 7.70826 12.8295 8.39813 11.9705C10.6656 9.14692 13.6659 6.98122 17.0877 5.72166C21.1357 4.23155 25.557 4.08947 29.6924 5.31659C33.8278 6.54371 37.456 9.07434 40.0361 12.5313C42.217 15.4533 43.5504 18.905 43.9108 22.5083C44.0205 23.6046 44.9033 24.5 46.0051 24.5Z" />
            </mask>
            <path
              d="M46.0051 24.5C47.1068 24.5 48.0086 23.6053 47.9172 22.5073C47.5452 18.0426 45.9291 13.7565 43.2335 10.1448C40.139 5.9986 35.7874 2.9634 30.8274 1.4916C25.8674 0.019799 20.5646 0.190212 15.7094 1.97744C11.4802 3.53423 7.78776 6.24518 5.04079 9.78438C4.36525 10.6547 4.63305 11.8965 5.55649 12.4975C6.47993 13.0984 7.70826 12.8295 8.39813 11.9705C10.6656 9.14692 13.6659 6.98122 17.0877 5.72166C21.1357 4.23155 25.557 4.08947 29.6924 5.31659C33.8278 6.54371 37.456 9.07434 40.0361 12.5313C42.217 15.4533 43.5504 18.905 43.9108 22.5083C44.0205 23.6046 44.9033 24.5 46.0051 24.5Z"
              stroke="#572402ff"
              strokeWidth="8"
              mask="url(#path-2-inside-1_2527_20912)"
            />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-700 text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium animate-pulse px-2 leading-relaxed" style={{fontFamily: 'Kanit, sans-serif', fontWeight: '500', letterSpacing: '0.025em'}}>
            กำลังโหลดข้อมูล...
        </p>
      </div>
    </section>
    </>
  );
}