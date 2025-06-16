Tasks:


In family managment: 
Add Dynamic status calculations: 
// This code runs on every request to /api/users/:id
const screeningsWithDetails = await Promise.all(updatedUserScreenings.map(async us => {
  const screening = allScreenings.find(s => s.id === us.screeningId);
  
  let status = us.status;
  if (status !== "completed" && screening) {
    const birthDate = new Date(user.dateOfBirth);
    const birthYear = birthDate.getFullYear();
    const currentYear = new Date().getFullYear(); // This will automatically use the current year
    
    const targetYear = birthYear + screening.startAge;
    
    if (currentYear < targetYear) {
      status = "later";
    } else if (currentYear === targetYear || currentYear === targetYear + 1) {
      status = "due";
    } else {
      status = "overdue";
    }

    // Updates the status in the database if it has changed
    if (status !== us.status) {
      await storage.updateUserScreening(us.id, {
        status: status,
        nextDue: us.nextDue
      });
    }
  }
  
  return {
    ...us,
    status,
    screening
  };
}));



Add repeatablity screenings for families: 
// ... existing code ...
      // Calculate status for all screenings
      const screeningsWithDetails = await Promise.all(updatedUserScreenings.map(async us => {
        const screening = allScreenings.find(s => s.id === us.screeningId);
        
        // Dynamically calculate status if not completed
        let status = us.status;
        if (status !== "completed" && screening) {
          const now = new Date();
          
          // For repeatable screenings, use nextDue date to determine status
          if (screening.frequencyYears > 0) {
            const nextDue = new Date(us.nextDue);
            const oneYearAfterNextDue = new Date(nextDue);
            oneYearAfterNextDue.setFullYear(nextDue.getFullYear() + 1);
            
            if (now < nextDue) {
              status = "later";
            } else if (now >= nextDue && now < oneYearAfterNextDue) {
              status = "due";
            } else {
              status = "overdue";
            }
          } else {
            // For non-repeatable screenings, use the original age-based logic
            const birthDate = new Date(user.dateOfBirth);
            const birthYear = birthDate.getFullYear();
            const currentYear = now.getFullYear();
            const targetYear = birthYear + screening.startAge;
            
            if (currentYear < targetYear) {
              status = "later";
            } else if (currentYear === targetYear || currentYear === targetYear + 1) {
              status = "due";
            } else {
              status = "overdue";
            }
          }

          // Update the screening status in the database if it has changed
          if (status !== us.status) {
            await storage.updateUserScreening(us.id, {
              status: status,
              nextDue: us.nextDue // Keep the existing nextDue date
            });
          }
        }
        
        return {
          ...us,
          status,
          screening
        };
      }));

      Fix one-time tests (no dublicates:):

      // ... existing code ...
      // If completing a screening and it has a frequency
      if (updates.status === 'completed' && screening.frequencyYears > 0) {
        // After updating, check for other incomplete screenings (excluding the one just updated)
        const nextDue = new Date(updates.nextDue!);
        const now = new Date();
        let newStatus: "later" | "due" | "overdue";
        // More precise status calculation using full date
        const oneYearAfterNextDue = new Date(nextDue);
        oneYearAfterNextDue.setFullYear(nextDue.getFullYear() + 1);
        if (now < nextDue) {
          newStatus = "later";
        } else if (now >= nextDue && now < oneYearAfterNextDue) {
          newStatus = "due";
        } else {
          newStatus = "overdue";
        }
        // Check for other incomplete screening for this user and screeningId (excluding the just-completed one)
        const otherIncomplete = (await storage.getUserScreenings(currentScreening.userId))
          .find(us => us.screeningId === screening.id && us.status !== 'completed' && us.id !== id);
        if (!otherIncomplete) {
          console.log(`[PUT /api/user-screenings/${id}] Creating repeatable screening with nextDue: ${nextDue.toISOString()}, status: ${newStatus}`);
          await storage.createUserScreening({
            userId: currentScreening.userId,
            screeningId: screening.id,
            lastCompleted: null,
            nextDue: nextDue.toISOString(),
            status: newStatus
          });
        } else {
          console.log(`[PUT /api/user-screenings/${id}] Not creating repeatable screening: another incomplete exists with id ${otherIncomplete.id} and status ${otherIncomplete.status}`);
        }
      } else if (updates.status === 'completed' && screening.frequencyYears === 0) {
        // For non-repeatable screenings, just mark as completed and don't create a new one
        console.log(`[PUT /api/user-screenings/${id}] Non-repeatable screening marked as completed, no new screening created`);
      }
// ... existing code ...
// ... existing code ...

AND: 

// ... existing code ...
      // Check for new screenings based on current age
      for (const screening of allScreenings) {
        // Skip if user already has this screening
        if (userScreenings.some(us => us.screeningId === screening.id && us.status !== 'completed')) {
          continue;
        }

        // Skip if this is a one-time test (frequencyYears === 0) and user already has it (completed or not)
        if (screening.frequencyYears === 0 && userScreenings.some(us => us.screeningId === screening.id)) {
          continue;
        }

        // Check if screening applies to this user's gender and age range
        const genderMatches = screening.genderApplicable === "both" || screening.genderApplicable === user.gender;
        const withinAgeRange = screening.endAge === null || userAge <= screening.endAge;
// ... existing code ...
