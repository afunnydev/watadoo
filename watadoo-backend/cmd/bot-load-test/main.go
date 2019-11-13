package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	vegeta "github.com/tsenart/vegeta/lib"
)

// Currently, not working with this test user. We are using a Page Token from a real Page, and no real pages can be interact with test users (vice-versa). The user used is Stephane's. You can change the ID for another user, note that the test will send that person 160 messages lol.

func main() {
	// Dialogflow quotas are 180 req per second.
	rate := vegeta.Rate{Freq: 20, Per: time.Second}
	duration := 4 * time.Second
	data := map[string]interface{}{
		"object": "page",
		"entry": []map[string]interface{}{
			{
				"id":   "114547896645101",
				"time": 1573659037340,
				"messaging": []map[string]interface{}{
					{
						"sender": map[string]interface{}{
							"id": "3497293120282589",
						},
						"recipient": map[string]interface{}{
							"id": "114547896645101",
						},
						"timestamp": 1573659036907,
						"message": map[string]interface{}{
							"text": "hello watadoo",
						},
					},
				},
			},
		},
	}
	testReq, _ := json.Marshal(data)

	// TODO: Add more different intents
	targeter := vegeta.NewStaticTargeter(vegeta.Target{
		Method: "POST",
		URL:    "http://localhost:5000/webhook/facebook",
		Header: map[string][]string{
			"Content-Type": []string{"application/json"},
		},
		Body: testReq,
	})
	attacker := vegeta.NewAttacker()

	var metrics vegeta.Metrics
	for res := range attacker.Attack(targeter, rate, duration, "Greeting") {
		metrics.Add(res)
	}
	metrics.Close()

	reporter := vegeta.NewJSONReporter(&metrics)
	buf := new(bytes.Buffer)
	reporter.Report(buf)
	fmt.Println(buf.String())
	fmt.Printf("99th percentile: %s\n", metrics.Latencies.P99)
}
