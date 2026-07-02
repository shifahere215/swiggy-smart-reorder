import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { profileId, action } = await request.json(); // action: 'add' or 'dismiss'
  
  if (!profileId || !action) {
    return NextResponse.json({ error: 'Missing profileId or action' }, { status: 400 });
  }

  const profile = await prisma.userItemProfile.findUnique({
    where: { id: profileId }
  });

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'add') {
    // Reset streak, calculate next nudge at
    const nextNudgeAt = new Date(profile.last_purchased_at);
    // Add avg_days_between * cycle_multiplier
    nextNudgeAt.setDate(nextNudgeAt.getDate() + (profile.avg_days_between * profile.cycle_multiplier));
    
    await prisma.userItemProfile.update({
      where: { id: profileId },
      data: {
        dismiss_streak: 0,
        next_nudge_at: nextNudgeAt
      }
    });

    await prisma.nudgeLog.create({
      data: {
        user_item_profile_id: profileId,
        nudge_type: 'session_card',
        outcome: 'added_to_cart',
        outcome_at: new Date(),
        surface: 'in_app_card'
      }
    });
  } else if (action === 'dismiss') {
    // Increment streak
    let newStreak = profile.dismiss_streak + 1;
    let newMultiplier = profile.cycle_multiplier;
    let newNextNudge = profile.next_nudge_at; // unchanged initially

    if (newStreak >= 2) {
      newMultiplier += 0.5;
      newStreak = 0;
      // recalculate next nudge at
      newNextNudge = new Date(profile.last_purchased_at);
      newNextNudge.setDate(newNextNudge.getDate() + (profile.avg_days_between * newMultiplier));
    } else {
       // if only 1 dismiss, push it to next session by just updating outcome
       // we can leave next_nudge_at as is, so it shows next session. 
       // For MVP, we might push it a few hours just so it hides for this session.
       newNextNudge = new Date();
       newNextNudge.setHours(newNextNudge.getHours() + 1); 
    }

    await prisma.userItemProfile.update({
      where: { id: profileId },
      data: {
        dismiss_streak: newStreak,
        cycle_multiplier: newMultiplier,
        next_nudge_at: newNextNudge
      }
    });

    await prisma.nudgeLog.create({
      data: {
        user_item_profile_id: profileId,
        nudge_type: 'session_card',
        outcome: 'dismissed',
        outcome_at: new Date(),
        surface: 'in_app_card'
      }
    });
  }

  return NextResponse.json({ success: true });
}
