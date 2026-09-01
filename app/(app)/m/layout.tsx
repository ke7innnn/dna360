import React from 'react'

export default function MemberTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full">
      {children}
    </div>
  )
}
