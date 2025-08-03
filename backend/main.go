package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var db *sqlx.DB

type Grave struct {
	ID           int      `db:"id" json:"id"`
	Name         string   `db:"name" json:"name"`
	City         string   `db:"city" json:"city"`
	Address      string   `db:"address" json:"address"`
	Coordinates  string   `db:"coordinates" json:"coordinates"`
	Photo        string   `db:"photo" json:"photo"`
	TelegramLink string   `db:"telegram_link" json:"telegramLink"`
	TwoGISLink   string   `db:"two_gis_link" json:"twoGISLink"`
	Rating       float64  `db:"rating" json:"rating"`
	Burials      []Burial `db:"-" json:"burials"`
}

type Burial struct {
	ID          int    `db:"id" json:"id"`
	GraveID     int    `db:"grave_id" json:"graveId"`
	FIO         string `db:"fio" json:"fio"`
	City        string `db:"city" json:"city"`
	Address     string `db:"address" json:"address"`
	Coordinates string `db:"coordinates" json:"coordinates"`
}

type RelativeClaim struct {
	ID       int    `db:"id" json:"id"`
	GraveID  int    `db:"grave_id" json:"graveId"`
	Name     string `db:"name" json:"name"`
	Relation string `db:"relation" json:"relation"`
	FilePath string `db:"file_path" json:"filePath"`
	FileName string `db:"file_name" json:"fileName"`
	Status   string `db:"status" json:"status"`
}

func initDB() error {
	var err error
	db, err = sqlx.Connect("postgres", "user=gravecareuser password=root dbname=graves_db sslmode=disable")
	if err != nil {
		return fmt.Errorf("ошибка подключения к базе данных: %v", err)
	}

	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS graves (
            id SERIAL PRIMARY KEY,
            name TEXT,
            city TEXT NOT NULL,
            address TEXT NOT NULL,
            coordinates TEXT NOT NULL,
            photo TEXT,
            telegram_link TEXT,
            two_gis_link TEXT,
            rating NUMERIC(3, 1)
        )
    `)
	if err != nil {
		return fmt.Errorf("ошибка создания таблицы graves: %v", err)
	}

	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS burials (
            id SERIAL PRIMARY KEY,
            grave_id INTEGER NOT NULL,
            fio TEXT NOT NULL,
            city TEXT NOT NULL,
            address TEXT NOT NULL,
            coordinates TEXT NOT NULL,
            FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE
        )
    `)
	if err != nil {
		return fmt.Errorf("ошибка создания таблицы burials: %v", err)
	}

	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS relative_claims (
            id SERIAL PRIMARY KEY,
            grave_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            relation TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE
        )
    `)
	if err != nil {
		return fmt.Errorf("ошибка создания таблицы relative_claims: %v", err)
	}

	log.Println("База данных подключена и таблицы готовы")
	return nil
}

func main() {
	if err := initDB(); err != nil {
		log.Fatalf("Ошибка инициализации базы данных: %v", err)
	}
	defer db.Close()

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"https://grave-care.vercel.app"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	r.Static("/uploads", "./uploads")

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Welcome to GraveCare API. Use /graves for data.",
		})
	})

	r.GET("/graves", getGraves)
	r.GET("/graves/:id", getGraveByID)
	r.POST("/graves", createGrave)
	r.PUT("/graves/:id", updateGrave)
	r.DELETE("/graves/:id", deleteGrave)
	r.POST("/graves/:id/upload-photo", uploadGravePhoto)

	r.GET("/burials", getBurials)
	r.GET("/burials/:id", getBurialByID)
	r.GET("/graves/:id/burials", getBurialsByGraveID)

	r.POST("/relative-claims", submitRelativeClaim)
	r.GET("/relative-claims", getRelativeClaims)
	r.PUT("/relative-claims/:id/status", updateRelativeClaimStatus)
	r.GET("/relative-claims/:id/file", downloadClaimFile)

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}

func getGraves(c *gin.Context) {
	name := c.Query("name")
	city := c.Query("city")
	address := c.Query("address")

	query := "SELECT id, name, city, address, coordinates, photo, telegram_link, two_gis_link, rating FROM graves"
	args := []interface{}{}
	if name != "" {
		query += " WHERE name ILIKE $1"
		args = append(args, "%"+name+"%")
	}
	if city != "" {
		if name != "" {
			query += " AND city ILIKE $2"
			args = append(args, "%"+city+"%")
		} else {
			query += " WHERE city ILIKE $1"
			args = append(args, "%"+city+"%")
		}
	}
	if address != "" {
		if name != "" || city != "" {
			query += " AND address ILIKE $" + strconv.Itoa(len(args)+1)
			args = append(args, "%"+address+"%")
		} else {
			query += " WHERE address ILIKE $1"
			args = append(args, "%"+address+"%")
		}
	}

	var graves []Grave
	err := db.Select(&graves, query, args...)
	if err != nil {
		log.Printf("Ошибка получения могил: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, graves)
}

func getGraveByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID могилы"})
		return
	}

	var grave Grave
	err = db.Get(&grave, "SELECT id, name, city, address, coordinates, photo, telegram_link, two_gis_link, rating FROM graves WHERE id=$1", id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Могила не найдена"})
		return
	}
	if err != nil {
		log.Printf("Ошибка получения могилы по ID %d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var burials []Burial
	err = db.Select(&burials, "SELECT id, grave_id, fio, city, address, coordinates FROM burials WHERE grave_id=$1", id)
	if err != nil {
		log.Printf("Ошибка получения burials для могилы с ID %d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	grave.Burials = burials

	c.JSON(http.StatusOK, grave)
}

func getBurials(c *gin.Context) {
	fio := c.Query("fio")
	city := c.Query("city")

	query := "SELECT id, grave_id, fio, city, address, coordinates FROM burials"
	args := []interface{}{}
	if fio != "" {
		query += " WHERE fio ILIKE $1"
		args = append(args, "%"+fio+"%")
	}
	if city != "" {
		if fio != "" {
			query += " AND city ILIKE $2"
			args = append(args, "%"+city+"%")
		} else {
			query += " WHERE city ILIKE $1"
			args = append(args, "%"+city+"%")
		}
	}

	var burials []Burial
	err := db.Select(&burials, query, args...)
	if err != nil {
		log.Printf("Ошибка получения захороненных: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, burials)
}

func getBurialByID(c *gin.Context) {
	id := c.Param("id")
	var burial Burial
	err := db.Get(&burial, "SELECT id, grave_id, fio, city, address, coordinates FROM burials WHERE id=$1", id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Захоронение не найдено"})
		return
	}
	if err != nil {
		log.Printf("Ошибка получения захоронения по ID %s: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, burial)
}

func createGrave(c *gin.Context) {
	var newGrave Grave
	if err := c.ShouldBindJSON(&newGrave); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if newGrave.City == "" || newGrave.Address == "" || newGrave.Coordinates == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "City, Address, and Coordinates are required"})
		return
	}

	var id int
	err := db.QueryRow(
		`INSERT INTO graves (name, city, address, coordinates, photo, telegram_link, two_gis_link, rating) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
		newGrave.Name, newGrave.City, newGrave.Address, newGrave.Coordinates, newGrave.Photo, newGrave.TelegramLink, newGrave.TwoGISLink, newGrave.Rating,
	).Scan(&id)
	if err != nil {
		log.Printf("Ошибка создания могилы: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create grave"})
		return
	}

	newGrave.ID = id
	log.Printf("Могила с ID %d успешно создана", id)
	c.JSON(http.StatusOK, newGrave)
}

func updateGrave(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Grave ID"})
		return
	}

	var updatedGrave Grave
	if err := c.ShouldBindJSON(&updatedGrave); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if updatedGrave.City == "" || updatedGrave.Address == "" || updatedGrave.Coordinates == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "City, Address, and Coordinates are required"})
		return
	}

	result, err := db.Exec(
		`UPDATE graves SET name=$1, city=$2, address=$3, coordinates=$4, photo=$5, telegram_link=$6, two_gis_link=$7, rating=$8 WHERE id=$9`,
		updatedGrave.Name, updatedGrave.City, updatedGrave.Address, updatedGrave.Coordinates, updatedGrave.Photo, updatedGrave.TelegramLink, updatedGrave.TwoGISLink, updatedGrave.Rating, id,
	)
	if err != nil {
		log.Printf("Ошибка обновления могилы с ID %d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = db.Exec(
		`UPDATE burials SET city=$1, address=$2, coordinates=$3 WHERE grave_id=$4`,
		updatedGrave.City, updatedGrave.Address, updatedGrave.Coordinates, id,
	)
	if err != nil {
		log.Printf("Ошибка обновления данных в burials для могилы с ID %d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Ошибка проверки затронутых строк: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grave not found"})
		return
	}

	log.Printf("Могила с ID %d успешно обновлена", id)
	c.JSON(http.StatusOK, gin.H{"message": "Grave updated successfully"})
}

func deleteGrave(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Grave ID"})
		return
	}

	result, err := db.Exec("DELETE FROM graves WHERE id = $1", id)
	if err != nil {
		log.Printf("Ошибка удаления могилы с ID %d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Ошибка проверки затронутых строк: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grave not found"})
		return
	}

	log.Printf("Могила с ID %d успешно удалена", id)
	c.JSON(http.StatusOK, gin.H{"message": "Grave deleted successfully"})
}

func uploadGravePhoto(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Grave ID"})
		return
	}

	var grave Grave
	err = db.Get(&grave, "SELECT id FROM graves WHERE id=$1", id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grave not found"})
		return
	}
	if err != nil {
		log.Printf("Ошибка проверки могилы с ID %d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	err = c.Request.ParseMultipartForm(10 << 20)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get photo"})
		return
	}

	fileExt := strings.ToLower(filepath.Ext(file.Filename))
	if fileExt != ".jpg" && fileExt != ".jpeg" && fileExt != ".png" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format. Only JPG, JPEG, PNG are allowed"})
		return
	}

	uploadDir := "./uploads/graves"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	filePath := filepath.Join(uploadDir, fmt.Sprintf("%d_%s", id, file.Filename))
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save photo"})
		return
	}

	_, err = db.Exec("UPDATE graves SET photo=$1 WHERE id=$2", fmt.Sprintf("/uploads/graves/%d_%s", id, file.Filename), id)
	if err != nil {
		log.Printf("Ошибка обновления фото для могилы с ID %d: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update photo path"})
		return
	}

	log.Printf("Фото для могилы с ID %d успешно загружено", id)
	c.JSON(http.StatusOK, gin.H{"message": "Photo uploaded successfully", "photoPath": fmt.Sprintf("/uploads/graves/%d_%s", id, file.Filename)})
}

func getBurialsByGraveID(c *gin.Context) {
	graveID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Grave ID"})
		return
	}

	var burials []Burial
	err = db.Select(&burials, "SELECT id, grave_id, fio, city, address, coordinates FROM burials WHERE grave_id=$1", graveID)
	if err != nil {
		log.Printf("Ошибка получения захороненных для могилы с ID %d: %v", graveID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, burials)
}

func submitRelativeClaim(c *gin.Context) {
	err := c.Request.ParseMultipartForm(10 << 20)
	if err != nil {
		log.Printf("Ошибка парсинга формы: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	graveIDStr := c.PostForm("graveId")
	name := c.PostForm("name")
	relation := c.PostForm("relation")

	graveID, err := strconv.Atoi(graveIDStr)
	if err != nil {
		log.Printf("Некорректный graveId: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Grave ID"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("Ошибка получения файла: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get file"})
		return
	}

	fileExt := strings.ToLower(filepath.Ext(file.Filename))
	if fileExt != ".pdf" && fileExt != ".jpg" && fileExt != ".jpeg" && fileExt != ".png" {
		log.Printf("Недопустимый формат файла: %s", fileExt)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format. Only PDF, JPG, JPEG, PNG are allowed"})
		return
	}

	uploadDir := "./uploads/claims"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		log.Printf("Ошибка создания директории uploads: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Генерируем уникальное имя файла с использованием таймстэмпа
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	uniqueFileName := fmt.Sprintf("%s_%s", timestamp, file.Filename)
	filePath := filepath.Join(uploadDir, uniqueFileName)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		log.Printf("Ошибка сохранения файла: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Проверяем существование могилы
	var grave Grave
	err = db.Get(&grave, "SELECT id FROM graves WHERE id=$1", graveID)
	if err == sql.ErrNoRows {
		log.Printf("Могила с ID %d не найдена", graveID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Grave not found"})
		return
	}
	if err != nil {
		log.Printf("Ошибка проверки могилы с ID %d: %v", graveID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Используем SERIAL для автоматической генерации ID
	var claimID int
	err = db.QueryRow(
		`INSERT INTO relative_claims (grave_id, name, relation, file_path, file_name, status) 
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		graveID, name, relation, filePath, uniqueFileName, "На рассмотрении",
	).Scan(&claimID)
	if err != nil {
		log.Printf("Ошибка сохранения заявки в базу данных: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save claim"})
		return
	}

	log.Printf("Заявка с ID %d успешно сохранена", claimID)
	c.JSON(http.StatusOK, gin.H{"message": "Claim submitted successfully", "claimId": claimID})
}

func getRelativeClaims(c *gin.Context) {
	var claims []RelativeClaim
	err := db.Select(&claims, "SELECT id, grave_id, name, relation, file_path, file_name, status FROM relative_claims")
	if err != nil {
		log.Printf("Ошибка получения заявок: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, claims)
}

func updateRelativeClaimStatus(c *gin.Context) {
	claimID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Claim ID"})
		return
	}

	var update struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if update.Status != "Подтверждено" && update.Status != "Отклонено" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	result, err := db.Exec("UPDATE relative_claims SET status = $1 WHERE id = $2", update.Status, claimID)
	if err != nil {
		log.Printf("Ошибка обновления статуса заявки с ID %d: %v", claimID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Ошибка проверки затронутых строк: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Claim not found"})
		return
	}

	log.Printf("Статус заявки с ID %d обновлён на %s", claimID, update.Status)
	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

func downloadClaimFile(c *gin.Context) {
	claimID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Claim ID"})
		return
	}

	var claim RelativeClaim
	err = db.Get(&claim, "SELECT id, file_path, file_name FROM relative_claims WHERE id = $1", claimID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Claim not found"})
		return
	}
	if err != nil {
		log.Printf("Ошибка получения заявки с ID %d: %v", claimID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	file, err := os.Open(claim.FilePath)
	if err != nil {
		log.Printf("Ошибка открытия файла для заявки с ID %d: %v", claimID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer file.Close()

	fileExt := filepath.Ext(claim.FilePath)
	contentType := "application/octet-stream"
	if fileExt == ".pdf" {
		contentType = "application/pdf"
	} else if fileExt == ".jpg" || fileExt == ".jpeg" {
		contentType = "image/jpeg"
	} else if fileExt == ".png" {
		contentType = "image/png"
	}

	c.Header("Content-Type", contentType)
	c.FileAttachment(claim.FilePath, claim.FileName)
}
