using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AquentaLibrary.Models
{
    public class TariffVersionModel
    {
        public string VersionName { get; set; }
        public bool IsActive { get; set; }
    }
}