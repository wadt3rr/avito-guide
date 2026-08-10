package report

import (
	"bytes"
	"fmt"
	"math"
	"time"

	"codeberg.org/go-pdf/fpdf"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
	"golang.org/x/image/font/gofont/gomedium"
	"golang.org/x/image/font/gofont/goregular"
)

const (
	pageWidth    = 210.0
	pageMargin   = 18.0
	contentWidth = pageWidth - 2*pageMargin
)

func AnalyticsPDF(scenario *models.Scenario, analytics *models.ScenarioAnalytics) ([]byte, error) {
	if scenario == nil || analytics == nil {
		return nil, fmt.Errorf("scenario and analytics are required")
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(pageMargin, 16, pageMargin)
	pdf.SetAutoPageBreak(true, 18)
	pdf.AddUTF8FontFromBytes("Go", "", goregular.TTF)
	pdf.AddUTF8FontFromBytes("Go Medium", "", gomedium.TTF)
	if pdf.Error() != nil {
		return nil, fmt.Errorf("register report fonts: %w", pdf.Error())
	}

	pdf.SetTitle("Аналитика онбординга", true)
	pdf.SetAuthor("Avito Tipper", true)
	pdf.SetFooterFunc(func() {
		pdf.SetY(-12)
		pdf.SetFont("Go", "", 8)
		pdf.SetTextColor(120, 127, 137)
		pdf.CellFormat(0, 5, fmt.Sprintf("Страница %d", pdf.PageNo()), "", 0, "C", false, 0, "")
	})

	pdf.AddPage()
	drawReportHeader(pdf, scenario)
	drawMetrics(pdf, analytics)
	drawStepsTable(pdf, analytics)

	if pdf.Error() != nil {
		return nil, fmt.Errorf("render analytics report: %w", pdf.Error())
	}

	var output bytes.Buffer
	if err := pdf.Output(&output); err != nil {
		return nil, fmt.Errorf("write analytics report: %w", err)
	}

	return output.Bytes(), nil
}

func drawReportHeader(pdf *fpdf.Fpdf, scenario *models.Scenario) {
	pdf.SetFillColor(0, 170, 255)
	pdf.Circle(pageMargin+2, 20, 2, "F")
	pdf.SetFillColor(150, 80, 255)
	pdf.Circle(pageMargin+7, 20, 2, "F")
	pdf.SetFillColor(0, 210, 120)
	pdf.Circle(pageMargin+4.5, 25, 2, "F")

	pdf.SetXY(pageMargin+13, 16)
	pdf.SetFont("Go Medium", "", 15)
	pdf.SetTextColor(24, 26, 31)
	pdf.CellFormat(contentWidth-13, 8, "Avito Tipper", "", 1, "L", false, 0, "")

	pdf.Ln(9)
	pdf.SetX(pageMargin)
	pdf.SetFont("Go Medium", "", 24)
	pdf.MultiCell(contentWidth, 11, "Аналитика онбординга", "", "L", false)

	pdf.Ln(2)
	pdf.SetFont("Go Medium", "", 14)
	pdf.SetTextColor(50, 54, 61)
	pdf.MultiCell(contentWidth, 7, scenario.Title, "", "L", false)

	pdf.SetFont("Go", "", 9)
	pdf.SetTextColor(120, 127, 137)
	pdf.CellFormat(contentWidth, 6, "Сформировано: "+time.Now().Format("02.01.2006 15:04"), "", 1, "L", false, 0, "")
	pdf.Ln(6)
}

func drawMetrics(pdf *fpdf.Fpdf, analytics *models.ScenarioAnalytics) {
	const gap = 6.0
	cardWidth := (contentWidth - 2*gap) / 3
	y := pdf.GetY()

	drawMetricCard(pdf, pageMargin, y, cardWidth, "Запустили", fmt.Sprintf("%d", analytics.Started), 235, 246, 255)
	drawMetricCard(pdf, pageMargin+cardWidth+gap, y, cardWidth, "Завершили", fmt.Sprintf("%d", analytics.Finished), 235, 250, 242)
	drawMetricCard(pdf, pageMargin+2*(cardWidth+gap), y, cardWidth, "Конверсия", fmt.Sprintf("%.0f%%", analytics.Conversion), 245, 240, 255)

	pdf.SetY(y + 31)
}

func drawMetricCard(pdf *fpdf.Fpdf, x, y, width float64, label, value string, r, g, b int) {
	pdf.SetFillColor(r, g, b)
	pdf.SetDrawColor(224, 227, 232)
	pdf.RoundedRect(x, y, width, 25, 2.5, "1234", "DF")

	pdf.SetXY(x+5, y+4)
	pdf.SetFont("Go", "", 9)
	pdf.SetTextColor(92, 99, 109)
	pdf.CellFormat(width-10, 5, label, "", 1, "L", false, 0, "")
	pdf.SetX(x + 5)
	pdf.SetFont("Go Medium", "", 18)
	pdf.SetTextColor(24, 26, 31)
	pdf.CellFormat(width-10, 10, value, "", 0, "L", false, 0, "")
}

func drawStepsTable(pdf *fpdf.Fpdf, analytics *models.ScenarioAnalytics) {
	pdf.SetX(pageMargin)
	pdf.SetFont("Go Medium", "", 15)
	pdf.SetTextColor(24, 26, 31)
	pdf.CellFormat(contentWidth, 8, "Прохождение шагов", "", 1, "L", false, 0, "")
	pdf.Ln(3)

	if len(analytics.Steps) == 0 {
		pdf.SetFont("Go", "", 10)
		pdf.SetTextColor(92, 99, 109)
		pdf.MultiCell(contentWidth, 6, "В сценарии пока нет шагов или по ним ещё не собрана статистика.", "", "L", false)
		return
	}

	drawTableHeader(pdf)
	for _, step := range analytics.Steps {
		drawStepRow(pdf, analytics.Started, step)
	}
}

func drawTableHeader(pdf *fpdf.Fpdf) {
	widths := []float64{12, 96, 34, 32}
	labels := []string{"№", "Шаг", "Завершили", "Конверсия"}

	pdf.SetFont("Go Medium", "", 9)
	pdf.SetTextColor(72, 78, 87)
	pdf.SetFillColor(244, 246, 248)
	pdf.SetDrawColor(224, 227, 232)
	for index, label := range labels {
		pdf.CellFormat(widths[index], 9, label, "1", 0, "L", true, 0, "")
	}
	pdf.Ln(9)
}

func drawStepRow(pdf *fpdf.Fpdf, started int, step models.StepStats) {
	const (
		rowPadding = 2.0
		lineHeight = 5.0
	)
	widths := []float64{12, 96, 34, 32}
	titleLines := pdf.SplitLines([]byte(step.Title), widths[1]-2*rowPadding)
	rowHeight := math.Max(9, float64(len(titleLines))*lineHeight+2*rowPadding)

	if pdf.GetY()+rowHeight > 277 {
		pdf.AddPage()
		drawTableHeader(pdf)
	}

	x := pageMargin
	y := pdf.GetY()
	pdf.SetDrawColor(224, 227, 232)
	for _, width := range widths {
		pdf.Rect(x, y, width, rowHeight, "D")
		x += width
	}

	pdf.SetFont("Go", "", 9)
	pdf.SetTextColor(50, 54, 61)
	pdf.SetXY(pageMargin, y)
	pdf.CellFormat(widths[0], rowHeight, fmt.Sprintf("%d", step.StepOrder), "", 0, "C", false, 0, "")

	pdf.SetXY(pageMargin+widths[0]+rowPadding, y+rowPadding)
	pdf.MultiCell(widths[1]-2*rowPadding, lineHeight, step.Title, "", "L", false)

	completedX := pageMargin + widths[0] + widths[1]
	pdf.SetXY(completedX, y)
	pdf.CellFormat(widths[2], rowHeight, fmt.Sprintf("%d", step.Completed), "", 0, "C", false, 0, "")

	conversion := 0.0
	if started > 0 {
		conversion = float64(step.Completed) / float64(started) * 100
	}
	pdf.SetXY(completedX+widths[2], y)
	pdf.CellFormat(widths[3], rowHeight, fmt.Sprintf("%.0f%%", conversion), "", 0, "C", false, 0, "")
	pdf.SetY(y + rowHeight)
}
