package automation

import (
	"context"
	"time"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
)

// ManageNextOccurrence parse the events in the database and update every events with it's next occurrence date.
func ManageNextOccurrence(client *prisma.Client) error {
	// 1) Get all events that have 1 or more occurence(s) in the past.
	nowString := time.Now().Format(time.RFC3339)
	events, err := client.Events(&prisma.EventsParams{
		Where: &prisma.EventWhereInput{
			OccurrencesSome: &prisma.EventOccurrenceWhereInput{
				StartDateLt: &nowString,
			},
		},
	}).Exec(context.TODO())
	if err != nil {
		return err
	}

	orderByStartDate := prisma.EventOccurrenceOrderByInputStartDateAsc
	for _, event := range events {
		occurrences, err := client.EventOccurrences(&prisma.EventOccurrencesParams{
			Where: &prisma.EventOccurrenceWhereInput{
				Event: &prisma.EventWhereInput{
					ID: &event.ID,
				},
			},
			OrderBy: &orderByStartDate,
		}).Exec(context.TODO())
		if err != nil {
			return err
		}

		var toDelete []prisma.EventOccurrenceWhereUniqueInput
		var nextOccurrence string

		now := time.Now()
		for _, occurrence := range occurrences {
			startDate, err := time.Parse(time.RFC3339, occurrence.StartDate)
			if err != nil {
				return err
			}
			// If it's an old occurrence, we can safely delete it.
			if startDate.Before(now) {
				occurrenceID := occurrence.ID
				toDelete = append(toDelete, prisma.EventOccurrenceWhereUniqueInput{ID: &occurrenceID})
			} else {
				// Since the occurrences are ordered, the first occurence that's not in the past is the next occurrence.
				nextOccurrence = occurrence.StartDate
				break
			}
		}

		updateInput := prisma.EventUpdateInput{
			Occurrences: &prisma.EventOccurrenceUpdateManyWithoutEventInput{
				Delete: toDelete,
			},
		}
		// We don't want to overwrite it with an empty string.
		if nextOccurrence != "" {
			updateInput.NextOccurrenceDate = &nextOccurrence
		}

		if nextOccurrence != "" || len(toDelete) > 0 {
			_, err = client.UpdateEvent(prisma.EventUpdateParams{
				Data: updateInput,
				Where: prisma.EventWhereUniqueInput{
					ID: &event.ID,
				},
			}).Exec(context.TODO())
			if err != nil {
				return err
			}
		}
	}
	return nil
}
