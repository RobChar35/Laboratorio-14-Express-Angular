import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { StyleDictionary } from 'pdfmake/interfaces';

import * as xlsx from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

import * as papa from 'papaparse';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  filtroSeleccionado: string = 'todos';
  filtrarGenero: string = '';
  filtrarYear: number | null = null;
  peliculasFiltradas: any[] = [];
  
  peliculas: any[] = [];

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  aplicarFiltro() {
    if (this.filtroSeleccionado === 'todos') {
      this.peliculasFiltradas = this.peliculas;
    } else if (this.filtroSeleccionado === 'genero') {
      this.peliculasFiltradas = this.peliculas.filter(
        pelicula => pelicula.genero.toLowerCase() === this.filtrarGenero.toLowerCase()
      );
    } else if (this.filtroSeleccionado === 'year') {
      this.peliculasFiltradas = this.peliculas.filter(
        pelicula => pelicula.lanzamiento === this.filtrarYear
      );
    }
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
    });
  }

  exportarExcel() {
    const contenidoTabla = [
      ['Título', 'Género', 'Año de lanzamiento'],
      ...this.peliculasFiltradas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
    ];
  
    const workBook = xlsx.utils.book_new();
    const workSheet = xlsx.utils.aoa_to_sheet(contenidoTabla);
    xlsx.utils.book_append_sheet(workBook, workSheet, 'Películas');
    const buffer = xlsx.write(workBook, { bookType: 'xlsx', type: 'array' });
    this.guardarArchivo(buffer, 'informe_peliculas.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
  
  exportarCSV() {
    const csvData = papa.unparse({
      fields: ['Título', 'Género', 'Año de lanzamiento'],
      data: this.peliculasFiltradas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
    });
  
    this.descargarArchivo(csvData, 'peliculas.csv', 'text/csv;charset=utf-8;');
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Título', 'Género', 'Año de lanzamiento'],
            ...this.peliculasFiltradas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
          ]
        }
      }
    ];

    const estilos: StyleDictionary = {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      tableHeader: {
        fillColor: '#F2F2F2',
        bold: true
      },
      tableCell: {
        margin: [0, 5, 0, 5]
      }
    };

    const documentDefinition = {
      content: contenido,
      styles: estilos
    };

    pdfMake.createPdf(documentDefinition).open();
  }
  
  private guardarArchivo(buffer: any, fileName: string, fileType: string) {
    const data: Blob = new Blob([buffer], { type: fileType });
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      // Para IE
      (window.navigator as any).msSaveOrOpenBlob(data, fileName);
    } else {
      // Para otros navegadores
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
  }

  private descargarArchivo(data: any, fileName: string, fileType: string) {
    const blob = new Blob([data], { type: fileType });
    if ((navigator as any).msSaveBlob) {
      // Para IE
      (navigator as any).msSaveBlob(blob, fileName);
    } else {
      // Para otros navegadores
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }
}
